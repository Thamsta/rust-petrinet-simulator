import {AfterContentInit, Component, NgZone, ViewChild} from '@angular/core'
import {fabric} from 'fabric'
import {IEvent} from "fabric/fabric-impl"
import {ToolbarComponent} from "../toolbar/toolbar.component"
import {DrawingTools} from "../models"
import {Arc, baseOptions, Place, Text, Transition} from "../elements"
import {SimulatorService, States} from "../simulator/simulator.service"
import {ReachabilityGraphService} from "../reachability-graph/reachability-graph.service";
import {canvas_color, canvas_color_simulating, fill_color, toHeatColor} from "../colors"
import {InfoBarComponent} from "../infobar/info-bar.component";
import {NetDTO} from "../dtos";

export interface NetCanvas {
	getAllElements(): Object[]

    getTransitions(): Transition[]
    getPlaces(): Place[]
    getArcs(): Arc[]

	loadNet(net: NetDTO): void
}

@Component({
	selector: 'app-canvas',
	templateUrl: './canvas.component.html',
	styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterContentInit, NetCanvas {
	canvas: fabric.Canvas = new fabric.Canvas('canvas')
	lastSelected?: fabric.Object

	isLocked = false
	isDeadlocked = false // show notice on canvas if deadlocked
    places: Place[] = [] // cache places and transitions while locked.
    transitions: Transition[] = []

	gridSize = 20
	gridEnabled = false

	@ViewChild('toolbar') toolbar!: ToolbarComponent
	@ViewChild('infobar') infobar!: InfoBarComponent

	constructor(private simulatorService: SimulatorService, private rgService: ReachabilityGraphService, private ngZone: NgZone) {
		simulatorService.simulationEmitter.subscribe(event => {
			this.isDeadlocked = event.deadlocked
			this.setMarking(event.marking)
			if (event.state == States.Stopped) {
				this.unlock()
			} else {
				this.setTransitionHeat(event.firings)
			}
			this.canvas.renderAll()
		})
	}

	ngAfterContentInit() {
		this.canvas = new fabric.Canvas('canvas')
		this.setupCanvas()
		this.canvas.on('mouse:down', e => this.onClick(e))
		this.canvas.on('selection:created', e => this.selectCreate(e))
		this.canvas.on('selection:cleared', e => this.selectClear(e))
		this.canvas.on('object:moving', e => this.objectMoving(e))
        this.canvas.on('object:modified', e => this.objectModified(e))
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
		this.canvas.setBackgroundColor(canvas_color, this.canvas.renderAll.bind(this.canvas))

		// extra canvas settings
		this.canvas.preserveObjectStacking = true

		// add some basic shapes
		this.addPlace(150, 200)
		this.addTransition(350, 200)
	}

	private onClick(event: IEvent<MouseEvent>) {
		if (this.isLocked) {
			return
		}

		let x = event.e.offsetX
		let y = event.e.offsetY
		let target = this.getTarget(event)

		let tool = this.toolbar.selected

        // TODO: deselect text editing also from other tools than the select tool.
		switch (tool) {
            case DrawingTools.SELECT: {
                this.handleTextEditing(target)
                break
            }
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
				this.addOrRemoveToken(tool, target)
				break
			}
			case DrawingTools.GARBAGE: {
				this.deleteObject(target)
				break
			}
			case DrawingTools.ARC: {
				this.addArcFromLastSelected(target)
				break
			}
		}
		this.lastSelected = target
	}

    private handleTextEditing(target: Object | undefined) {
        if ((target instanceof Place || target instanceof Arc) && this.lastSelected == target) {
            target.enterEditing()
        } else {
            this.leaveTextEditing(target)
        }
    }

    private leaveTextEditing(target: Object | undefined) {
        this.getPlaces().concat()
            .filter(place => place != target)
            .forEach(place => place.exitEditing())
        this.getArcs()
            .filter(arc => arc != target)
            .forEach(arc => arc.exitEditing())
    }

	private addTransition = (x: number, y: number) => {
		return new Transition(x, y, this.canvas)
	}

	private addPlace = (x: number, y: number) => {
		return new Place(x, y, this.canvas)
	}

	private addArcFromLastSelected(target: fabric.Object | undefined) {
		this.addArc(this.lastSelected, target)
	}

	private addArc(source: fabric.Object | undefined, target: fabric.Object | undefined) {
		if (target instanceof Place && source instanceof Transition
			|| target instanceof Transition && source instanceof Place) {
			let arc = new Arc(source, target, this.canvas)
			source.arcs.arcs_out.push(arc)
			target.arcs.arcs_in.push(arc)
			return arc
		}

		return undefined
	}

	private deleteObject(obj: fabric.Object | undefined) {
		if (obj instanceof Place || obj instanceof Transition || obj instanceof Arc) {
			obj.remove(this.canvas)
		}
		if (obj && this.lastSelected == obj) {
			this.lastSelected = undefined
		}
	}

	private addOrRemoveToken(mode: DrawingTools.TOKEN_INC | DrawingTools.TOKEN_DEC, obj: fabric.Object | undefined) {
		if (obj instanceof Place || obj instanceof Arc) {
			if (mode == DrawingTools.TOKEN_INC) {
				obj.increment()
			} else {
				obj.decrement()
			}
			this.canvas.renderAll()
		}
	}

	private selectClear(_: IEvent<MouseEvent>) {
		// after a group was disbanded, update text position of places.
		this.getPlaces().forEach(obj => obj.updateTextPosition())
		this.lastSelected = undefined
		this.canvas.renderAll()
	}

	private objectMoving(e: IEvent<MouseEvent>) {
		let target = e.target!
		if (target instanceof fabric.Group) {
			// TODO: fix grid placement for groups
			target.forEachObject(obj => this.moveObj(obj))
		} else {
			this.moveObj(target)
		}
		this.canvas.renderAll()
	}

	private moveObj(obj: fabric.Object) {
		if (this.gridEnabled) {
			let [left, top] = this.toGridCoordinate(obj.left!, obj.top!)
			obj.set({top: top, left: left})
		}
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
			obj.updateTextPosition()
		}
	}

	private toGridCoordinate(x: number, y: number): [number, number] {
		let xGrid = Math.round(x / this.gridSize) * this.gridSize
		let yGrid = Math.round(y / this.gridSize) * this.gridSize
		return [xGrid, yGrid]
	}

	/**
	 * Player.
	 * @param command
	 */
	async controlChanged(command: DrawingTools) {
        if (command != DrawingTools.SELECT) {
            this.leaveTextEditing(undefined)
        }

		let [p, pxt_in, pxt_out] = this.getNetAsMatrix()
		switch (command) {
            case DrawingTools.GARBAGE:
                // TODO: delete current selection
                break;
            case DrawingTools.RUN:
				if (this.simulatorService.isPaused()) {
					await this.simulatorService.continue()
				} else {
					this.lock()
					await this.startSimulationAsync(p, pxt_in, pxt_out, 1000)
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
		}
	}

	async startSimulationAsync(p: number[], pxt_in: number[][], pxt_out: number[][], steps: number) {
		try {
			await this.ngZone.runOutsideAngular(async () => {
				this.simulatorService.start(p, pxt_in, pxt_out, steps).then(_ => {
				});
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

	public getPlacesAndTransitions(): [Place[], Transition[]] {
        if (this.isLocked) {
            return [this.places, this.transitions]
        }
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

	public getNetAsMatrix(): [number[], number[][], number[][]] {
		let [places, transitions] = this.getPlacesAndTransitions()
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
        let [places, transitions] = this.getPlacesAndTransitions()
		this.isLocked = true
		this.canvas.setBackgroundColor(canvas_color_simulating, () => {
			this.canvas.renderAll()
		})
        this.places = places
        this.transitions = transitions
	}

	private unlock() {
		this.isDeadlocked = false
		this.resetTransitionHeat()
		this.canvas.setBackgroundColor(canvas_color, () => {
		})
		this.isLocked = false
        this.places = []
        this.transitions = []
	}

	private setMarking(p: number[]) {
		if (p.length == 0) return

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

	private selectCreate(e: IEvent<MouseEvent>) {
		let group = e.selected![0]!.group
		if (group == undefined) {
			return
		}

		group.set(baseOptions)
		group.getObjects().forEach(obj => {
			if (obj instanceof Arc) {
				obj.removeFromGroup(group!)
			}
			if (obj instanceof Place) {
				obj.addToGroup(group!)
			}
		})
		this.canvas.renderAll()
	}

    getAllElements(): Object[] {
        return this.canvas.getObjects()
            .filter(value => [Transition, Place, Arc].some(clazz => value instanceof clazz))
    }

	loadNet(net: NetDTO): void {
		this.deleteAllElements()
		let map = new Map<string, Transition | Place>()
		net.places.forEach(place => {
			let p = this.addPlace(place.position.x, place.position.y)
			p.setAmount(place.initialMarking)
			p.id = place.id
			map.set(p.id, p)
		})
		net.transitions.forEach(transition => {
			let t = this.addTransition(transition.position.x, transition.position.y)
			t.id = transition.id
			map.set(t.id, t)
		})
		net.arcs.forEach(arc => {
			let from = map.get(arc.source)
			let to = map.get(arc.target)

			let a = this.addArc(from, to)
			if (a == undefined) return;

			a.weight = +arc.text
			a.id = arc.id
		})
		this.canvas.renderAll();
	}

    getPlaces(): Place[] {
        return this.canvas.getObjects("circle")
            .filter(it => it instanceof Place)
            .map(it => it as Place)
    }

    getTransitions(): Transition[] {
        return this.canvas.getObjects("rect")
            .filter(it => it instanceof Transition)
            .map(it => it as Transition)
    }

    getArcs(): Arc[] {
        return this.canvas.getObjects("line")
            .filter(it => it instanceof Arc)
            .map(it => it as Arc)
    }

	private deleteAllElements(): void {
		this.canvas.getObjects().forEach(obj => {
			if (obj instanceof Transition || obj instanceof Place) {
				obj.remove(this.canvas)
			}
		})
	}

    private objectModified(e: IEvent<MouseEvent>) {
        if (e.target instanceof Text) {
            e.target.updateFromText()
        }
    }
}
