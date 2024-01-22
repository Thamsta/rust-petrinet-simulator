import {AfterViewInit, Component, NgZone, ViewChild} from '@angular/core';
import {fabric} from "fabric";
import {Arc, Place, Text} from "../elements";
import {ToolbarComponent} from "../toolbar/toolbar.component";
import {InfoBarComponent} from "../infobar/info-bar.component";
import {SimulatorService, States} from "../simulator/simulator.service";
import {ReachabilityGraphService} from "../reachability-graph/reachability-graph.service";
import {IEvent} from "fabric/fabric-impl";
import {DrawingTools} from "../models";
import {CanvasComponent, CanvasEvent} from "../canvas/canvas.component";

/**
 * The superclass of the editor. It knows and connects all components. Contains the business logic of the editor.
 */
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterViewInit {

    @ViewChild('canvas') canvas!: CanvasComponent
    @ViewChild('toolbar') toolbar!: ToolbarComponent
    @ViewChild('infobar') infobar!: InfoBarComponent

    constructor(private simulatorService: SimulatorService, private rgService: ReachabilityGraphService, private ngZone: NgZone) {
        simulatorService.simulationEmitter.subscribe(event => {
            this.canvas.isDeadlocked = event.deadlocked
            this.canvas.setMarking(event.marking)
            if (event.state == States.Stopped) {
                this.canvas.unlock()
            } else {
                this.canvas.setTransitionHeat(event.firings)
            }
        })
    }

    ngAfterViewInit(): void {
        // add some basic shapes
        let p = this.canvas.addPlace(150, 200)
        let t = this.canvas.addTransition(350, 200)
        this.canvas.addArc(p, t)
    }

    private getTarget(event: fabric.IEvent<MouseEvent>): fabric.Object | undefined {
        let target = event.target
        return target instanceof Text ? target.parent : target
    }

    private onClick(event: IEvent<MouseEvent>) {
        let x = event.e.offsetX
        let y = event.e.offsetY
        let target = this.getTarget(event)

        let tool = this.toolbar.selected

        this.handleTextEditing(target, tool)

        switch (tool) {
            case DrawingTools.PLACE: {
                if (target == undefined) {
                    this.canvas.addPlace(x, y)
                }
                break
            }
            case DrawingTools.TRANSITION: {
                if (target == undefined) {
                    this.canvas.addTransition(x, y)
                }
                break
            }
            case DrawingTools.TOKEN_INC:
            case DrawingTools.TOKEN_DEC: {
                this.canvas.addOrRemoveToken(tool, target)
                break
            }
            case DrawingTools.GARBAGE: {
                this.canvas.deleteObject(target)
                break
            }
            case DrawingTools.ARC: {
                this.canvas.addArcFromLastSelected(target)
                break
            }
        }
        this.canvas.lastSelected = target
    }

    private handleTextEditing(target: Object | undefined, tool: DrawingTools) {
        if (tool == DrawingTools.SELECT
            && (target instanceof Place || target instanceof Arc)
            && this.isDoubleClick(target)) {
            target.enterEditing()
        } else {
            this.leaveTextEditing(target)
        }
    }

    private isDoubleClick(target: Object | undefined) {
        return this.canvas.lastSelected == target
    }

    private leaveTextEditing(target: Object | undefined) {
        this.canvas.getPlaces()
            .filter(place => place != target)
            .forEach(place => place.exitEditing())
        this.canvas.getArcs()
            .filter(arc => arc != target)
            .forEach(arc => arc.exitEditing())
    }

    /**
     * React on a changed tool.
     * @param command
     */
    async controlChanged(command: DrawingTools) {
        this.leaveTextEditing(undefined)

        let [p, pxt_in, pxt_out] = this.getNetAsMatrix()
        switch (command) {
            case DrawingTools.GARBAGE:
                // TODO: delete current selection
                break;
            case DrawingTools.RUN:
                if (this.simulatorService.isPaused()) {
                    await this.simulatorService.continue()
                } else {
                    this.canvas.lock()
                    await this.startSimulationAsync(p, pxt_in, pxt_out, 1000)
                }
                break;
            case DrawingTools.STEP:
                this.canvas.lock()
                await this.simulatorService.step(p, pxt_in, pxt_out)
                break;
            case DrawingTools.STOP:
                this.simulatorService.stop()
                break;
            case DrawingTools.PAUSE:
                this.simulatorService.pause()
                break;
            case DrawingTools.RG:
                this.rg(p, pxt_in, pxt_out)
                break;
        }
    }

    async startSimulationAsync(p: number[], pxt_in: number[][], pxt_out: number[][], steps: number) {
        try {
            await this.ngZone.runOutsideAngular(async () => {
                this.simulatorService.start(p, pxt_in, pxt_out, steps).then(_ => {});
            });
        } catch (error) {
            console.error('Error during simulation:', error);
        }
    }

    private rg(p: number[], pxt_in: number[][], pxt_out: number[][]) {
        this.rgService.createRG(p, pxt_in, pxt_out).then(response => {
            this.infobar.updateRGInfos(response)
        }, (error) => {
            this.infobar.updateOnError(error)
        })
    }

    public getNetAsMatrix(): [number[], number[][], number[][]] {
        let [places, transitions] = this.canvas.getPlacesAndTransitions()
        let pxt_in: number[][] = []
        let pxt_out: number[][] = []

        const p = places.map(p => p.tokens)
        const place_to_index = new Map<string, number>(places.map((p, i) => [p.id, i]))

        transitions.forEach(transition => {
            let t_in_array = Array(p.length).fill(0)
            let t_out_array = Array(p.length).fill(0)
            transition.arcs.arcs_out.forEach(arc => t_out_array[place_to_index.get(arc.to.id)!] = arc.weight)
            transition.arcs.arcs_in.forEach(arc => t_in_array[place_to_index.get(arc.from.id)!] = arc.weight)
            pxt_in.push(t_in_array)
            pxt_out.push(t_out_array)
        })

        return [p, pxt_in, pxt_out]
    }

	canvasMouseEvent(event: CanvasEvent) {
		if (event.type === 'mouse:down') {
            this.onClick(event.source)
        }
    }
}
