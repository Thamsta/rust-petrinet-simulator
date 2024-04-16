import {AfterViewInit, Component, EventEmitter, Input, NgZone, Output, ViewChild} from '@angular/core';
import {fabric} from "fabric";
import {Arc, Place, Text} from "../elements";
import {SimulatorService, States} from "../simulator/simulator.service";
import {ReachabilityGraphService} from "../reachability-graph/reachability-graph.service";
import {IEvent} from "fabric/fabric-impl";
import {DrawingTools} from "../editor-toolbar/types";
import {CanvasComponent} from "../canvas/canvas.component";
import {NetDTO} from "../dtos";
import {WindowManagerComponent} from "../window-manager/window-manager.component";
import {v4 as uuidv4} from "uuid";
import {MatDialog} from "@angular/material/dialog";
import {EditorToolbarComponent} from "../editor-toolbar/editor-toolbar.component";
import {createNetDTO} from "../export/export.component";
import {EditorOpenRgDialogComponent} from "../editor-open-rg-dialog/editor-open-rg-dialog.component";
import {EditorRgInfobarComponent} from "../editor-rg-infobar/editor-rg-infobar.component";
import {CanvasEvent, NetRenameEvent} from "../canvas/shared/canvas.model";

export type NetChangedEvent = {
    id: string,
    net: NetDTO,
}

/**
 * The superclass of the editor. It knows and connects all components. Contains the business logic of the editor.
 */
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterViewInit {

    @Input() initNet: NetDTO | undefined
    @Input() initDirty!: boolean
    @Input() windowManager!: WindowManagerComponent

    @Output()
    netChangedEmitter = new EventEmitter<NetChangedEvent>()

    id = uuidv4()

    @ViewChild('canvas') canvas!: CanvasComponent
    @ViewChild('toolbar') toolbar!: EditorToolbarComponent
    @ViewChild('infobar') rgInfobar!: EditorRgInfobarComponent

    hideRGInfobar: boolean = true


    constructor(private dialog: MatDialog, private simulatorService: SimulatorService, private rgService: ReachabilityGraphService, private ngZone: NgZone) {
        simulatorService.simulationEmitter.subscribe(event => {
            this.canvas.isDeadlocked = event.deadlocked
            this.canvas.setMarking(event.marking)
            if (event.state == States.Stopped) {
                this.unlock()
            } else {
                this.canvas.setTransitionHeat(event.firings)
            }
        })
    }

    ngAfterViewInit(): void {
        if (this.initNet === undefined) return

        this.id = this.initNet.id
        this.canvas.loadNet(this.initNet, this.initDirty);
    }

    private getTarget(event: fabric.IEvent<MouseEvent>): fabric.Object | undefined {
        let target = event.target
        return target instanceof Text ? target.parent : target
    }

    private onClick(event: IEvent<MouseEvent>) {
        let x = event.e.offsetX
        let y = event.e.offsetY
        let target = this.getTarget(event)

        let tool = this.toolbar.getCurrentTool()

        this.handleTextEditing(target, tool)

        switch (tool) {
            case DrawingTools.PLACE: {
                if (target == undefined) {
                    this.canvas.addPlace(x, y)
                    this.toolbar.usedTool()
                }
                break
            }
            case DrawingTools.TRANSITION: {
                if (target == undefined) {
                    this.canvas.addTransition(x, y)
                    this.toolbar.usedTool()
                }
                break
            }
            case DrawingTools.GARBAGE: {
                this.canvas.deleteObject(target)
                this.toolbar.usedTool()
                break
            }
            case DrawingTools.ARC: {
                let arc = this.canvas.addArcFromLastSelected(target)
                if (arc != undefined) {
                    // only count as "used" if an arc was actually placed.
                    this.toolbar.usedTool()
                }
                break
            }
        }
        this.canvas.lastSelected = target
    }

    private lock() {
        this.canvas.lock()
        this.toolbar.lockEditor()
    }

    private unlock() {
        this.canvas.unlock()
        this.toolbar.unlockEditor()
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
     * @param tool
     */
    async controlChanged(tool: DrawingTools) {
        this.leaveTextEditing(undefined)

        let [p, pxt_in, pxt_out] = this.getNetAsMatrix()
        switch (tool) {
            case DrawingTools.GARBAGE:
                this.canvas.deleteCurrentSelection()
                this.toolbar.usedTool()
                break;
            case DrawingTools.TOKEN_DEC:
            case DrawingTools.TOKEN_DEC_5:
            case DrawingTools.TOKEN_INC:
            case DrawingTools.TOKEN_INC_5:
                this.canvas.addOrRemoveTokenOfCurrentSelection(tool)
                this.toolbar.usedTool()
                break;
            case DrawingTools.NAME:
                this.canvas.toggleNames()
                this.toolbar.usedTool()
                break;
            case DrawingTools.RUN:
                if (this.simulatorService.isPaused()) {
                    await this.simulatorService.continue()
                } else {
                    this.lock()
                    await this.startSimulationAsync(p, pxt_in, pxt_out, 100)
                }
                break;
            case DrawingTools.STEP:
                this.lock()
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
            case DrawingTools.RG_INFO:
                this.toggleRGInfo()
                break;
        }
    }

    async startSimulationAsync(p: number[], pxt_in: number[][], pxt_out: number[][], updateTime: number) {
        try {
            await this.ngZone.runOutsideAngular(async () => {
                this.simulatorService.start(p, pxt_in, pxt_out, updateTime).then(_ => {});
            });
        } catch (error) {
            console.error('Error during simulation:', error);
        }
    }

    private rg(p: number[], pxt_in: number[][], pxt_out: number[][]) {
        this.rgService.createRG(p, pxt_in, pxt_out).then(response => {
            this.rgInfobar.updateRGInfos(response)
            let stateString = response.states == 1 ? "state" : "states"
            let edgeString = response.edges == 1 ? "edge" : "edges"

            const dialogRef = this.dialog.open(EditorOpenRgDialogComponent, {
                data: {
                    isBounded: response.bounded >= 0,
                    checkboxText: `Reachability graph has ${response.states} ${stateString} and ${response.edges} ${edgeString}. Visualize in new window?`
                }
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result && result.confirmed) {
                    this.windowManager.openNewRG(response.dot_graph,"📊 new", this.id, result.replaceExisting)
                }
            });
        }, (error) => {
            this.rgInfobar.updateOnError(error)
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

    netRename(event: NetRenameEvent) {
        this.windowManager.renameNet(event.name, event.dirty, this.id)
    }

    getNetDTO(): NetDTO {
        return createNetDTO(this.canvas, this.canvas.name)
    }

    isDirty(): boolean {
        return this.canvas.isDirty
    }

    private toggleRGInfo() {
        this.hideRGInfobar = !this.hideRGInfobar
    }
}
