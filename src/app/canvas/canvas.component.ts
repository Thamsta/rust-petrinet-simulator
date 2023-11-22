import {AfterContentInit, Component, ViewChild} from '@angular/core'
import {fabric} from 'fabric'
import {IEvent} from "fabric/fabric-impl"
import {ToolbarComponent} from "../toolbar/toolbar.component"
import {DrawingTools, isRunCommand} from "../models"
import {Arc, Place, Transition, Text} from "../elements"
import {SimulatorService} from "../simulator.service"
import {canvas_color, canvas_color_simulating, fill_color, toHeatColor} from "../colors"
import {InfoBarComponent} from "../infobar/info-bar.component";

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterContentInit {
    canvas: fabric.Canvas = new fabric.Canvas('canvas')
    selected?: fabric.Object
    lastSelected?: fabric.Object

    isSimulating = false
    stopRequested = false
    startState: number[] | undefined

    @ViewChild('toolbar') toolbar!: ToolbarComponent
    @ViewChild('infobar') infobar!: InfoBarComponent

    constructor(private simulatorService: SimulatorService) {
    }

    ngAfterContentInit() {
        this.canvas = new fabric.Canvas('canvas')
        this.setupCanvas()
        this.canvas.on('mouse:down', (event) => this.onClick(event))
        this.canvas.on('selection:updated', (e) => this.selectUpdate(e))
        this.canvas.on('selection:cleared', (e) => this.selectClear(e))
        this.canvas.on('object:moving', (e) => this.objectMoving(e))
        window.addEventListener('resize', this.onWindowResize)
    }

    onWindowResize = () => {
        this.canvas.setDimensions({
            width: window.innerWidth,
            height: window.innerHeight
        })
    }


    private getTarget(event: fabric.IEvent<MouseEvent>): fabric.Object | undefined {
        let target = event.target
        return target instanceof Text ? target.parent : target
    }

    private setupCanvas = () => {
        this.canvas.setDimensions({
            width: window.innerWidth,
            height: window.innerHeight
        })
        this.canvas.setBackgroundColor('#fcfcfc', this.canvas.renderAll.bind(this.canvas))

        // extra canvas settings
        this.canvas.preserveObjectStacking = true


        this.addPlace(100, 200)
        this.addTransition(350, 200)
    }

    private onClick(event: IEvent<MouseEvent>) {
        if (this.isSimulating) {
            return
        }

        let x = event.e.offsetX
        let y = event.e.offsetY
        let target = this.getTarget(event)
        switch (this.toolbar.selected) {
            case DrawingTools.PLACE: {
                if (target == undefined) {
                    this.addPlace(x, y)
                }
                break
            }
            case DrawingTools.TRANSITION: {
                if (target == undefined) {
                    this.addTransition(x, y)
                }
                break
            }
            case DrawingTools.TOKEN_INC:
            case DrawingTools.TOKEN_DEC: {
                if (target instanceof Place || target instanceof Arc) {
                    this.addOrRemovePlaceToken(this.toolbar.selected, target)
                    this.canvas.renderAll()
                }
                break
            }
            case DrawingTools.GARBAGE: {
                if (target) {
                    this.deleteObject(target)
                }
            }
        }
    }

    private addTransition = (x: number, y: number) => {
        return new Transition(x, y, this.canvas)
    }

    private addPlace = (x: number, y: number) => {
        return new Place(x, y, this.canvas)
    }


    private deleteObject(obj: fabric.Object) {
        if (obj instanceof Place || obj instanceof Transition || obj instanceof Arc) {
            obj.remove(this.canvas)
        }
        if (this.lastSelected == obj) {
            this.lastSelected = undefined
        }
        if (this.selected == obj) {
            this.selected = undefined
        }
    }

    private selectUpdate(e: IEvent<MouseEvent>) {
        let obj = e.selected!![0]
        let lastObj = e.deselected!![0]
        switch (this.toolbar.selected) {
            case DrawingTools.GARBAGE: {
                this.canvas.remove(obj)
                break
            }
            case DrawingTools.ARC: {
                if (obj instanceof Place && lastObj instanceof Transition
                    || obj instanceof Transition && lastObj instanceof Place) {
                    let arc = new Arc(lastObj, obj, this.canvas)
                    lastObj.arcs.arcs_out.push(arc)
                    obj.arcs.arcs_in.push(arc)
                }
                break
            }
        }
        this.lastSelected = this.selected
        this.selected = obj
    }

    private addOrRemovePlaceToken(mode: DrawingTools.TOKEN_INC | DrawingTools.TOKEN_DEC, obj: Place | Arc) {
        if (mode == DrawingTools.TOKEN_INC) {
            obj.increment()
        } else {
            obj.decrement()
        }
    }

    private selectClear(_: IEvent<MouseEvent>) {
        this.lastSelected = undefined
        this.selected = undefined
    }

    private objectMoving(e: IEvent<MouseEvent>) {
        let target = e.target!
        if (target instanceof fabric.Group) {
            target.forEachObject(obj => this.moveObj(obj))
        } else {
            this.moveObj(target)
        }
        this.canvas.renderAll()
    }

    private moveObj(obj: fabric.Object) {
        if (obj instanceof Place || obj instanceof Transition) {
            obj.arcs.arcs_out.forEach(arc => {
                arc.set({x1: obj.left, y1: obj.top})
                arc.updateLinePoints()
            })
            obj.arcs.arcs_in.forEach(arc => {
                arc.set({x2: obj.left, y2: obj.top})
                arc.updateLinePoints()
            })
        }
        if (obj instanceof Place) {
            obj.moveText()
        }
    }

    controlChanged(command: DrawingTools) {
        if (!isRunCommand(command) && command != DrawingTools.RG) {
            return
        }
        if (command == DrawingTools.STOP || command == DrawingTools.PAUSE) {
            this.stopRequested = true
            return
        }

        let [places, transitions] = this.getPlacesAndTransitions()
        let [p, pxt_in, pxt_out] = this.getNetAsMatrix(places, transitions)

        if (command == DrawingTools.RG) {
            this.rg(p, pxt_in, pxt_out)
            return // dont lock
        }

        this.startState = p
        this.lock()

        if (command == DrawingTools.STEP) {
            this.stopRequested = false
            this.step(p, pxt_in, pxt_out)
        }
        if (command == DrawingTools.RUN) {
            this.stopRequested = false
            this.run(p, pxt_in, pxt_out)
        }
    }

    private run(p: number[], pxt_in: number[][], pxt_out: number[][]) {
        if (this.stopRequested) {
            this.unlock()
            return
        }
        this.simulateSteps(p, pxt_in, pxt_out, 10000).then(marking => this.run(marking, pxt_in, pxt_out))
    }

    private step(p: number[], pxt_in: number[][], pxt_out: number[][]) {
        this.simulateSteps(p, pxt_in, pxt_out, 1).then(_ => { })
    }

    private rg(p: number[], pxt_in: number[][], pxt_out: number[][]) {
        this.simulatorService.createRG(p, pxt_in, pxt_out).then(response => {
            this.infobar.updateRGInfos(response)
        }, (error) => {
            this.infobar.updateOnError(error)
        })
    }

    public getPlacesAndTransitions(): [Place[], Transition[]] {
        let objects = this.canvas.getObjects()
        let places: Place[] = []
        let transitions: Transition[] = []

        objects.forEach(object => {
            if (object instanceof Place) {
                places.push(object)
            } else if (object instanceof Transition) {
                transitions.push(object)
            }
        })

        places.sort((p1, p2) => (p1.id > p2.id ? -1 : 1))
        transitions.sort((t1, t2) => (t1.id > t2.id ? -1 : 1))

        return [places, transitions]
    }

    public getNetAsMatrix(places: Place[], transitions: Transition[]): [number[], number[][], number[][]] {
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

    private lock() {
        this.isSimulating = true
        this.canvas.setBackgroundColor(canvas_color_simulating, () => {
            this.canvas.renderAll()
        })
    }

    private unlock() {
        this.canvas.setBackgroundColor(canvas_color, () => {
            this.canvas.renderAll()
        })
        this.isSimulating = false
        if (this.startState) {
            this.setMarking(this.startState)
        }
        this.resetTransitionHeat()
        this.canvas.renderAll()
    }

    private async simulateSteps(p: number[], pxt_in: number[][], pxt_out: number[][], steps: number): Promise<number[]> {
        const result = await this.simulatorService.sendToSimulator(p, pxt_in, pxt_out, steps)
        this.setMarking(result.marking)
        this.setTransitionHeat(result.firings)
        this.canvas.renderAll()
        return Promise.resolve(result.marking)
    }

    private setMarking(p: number[]) {
        let [places, _] = this.getPlacesAndTransitions()
        for (let i = 0; i < places.length; i++) {
            places[i].setAmount(p[i])
        }
    }

    private resetTransitionHeat() {
        let [_, transitions] = this.getPlacesAndTransitions()
        transitions.forEach(transition => {
            transition.set({fill: fill_color})
        })
    }

    private setTransitionHeat(firings: number[]) {
        let [_, transitions] = this.getPlacesAndTransitions()
        let sum = firings.reduce((accumulator, currentValue) => accumulator + currentValue, 1)

        firings.map(value => value / sum)
            .map(value => toHeatColor(value))
            .forEach((value, index) => {
                transitions[index].set({fill: value})
            })
    }
}
