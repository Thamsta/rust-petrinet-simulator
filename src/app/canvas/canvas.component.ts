import {AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core'
import {fabric} from 'fabric'
import {IEvent} from "fabric/fabric-impl"
import {DrawingTools, getDecIncValue} from "../editor-toolbar/types"
import {Arc, baseOptions, Place, Text, Transition} from "../elements"
import {canvas_color, canvas_color_simulating, fill_color, toHeatColor} from "../colors"
import {NetDTO} from "../dtos";
import {BaseToolbarComponent} from "../base-toolbar/base-toolbar.component";
import {WindowManagerComponent} from "../window-manager/window-manager.component";
import {gridEnabled, gridSize} from "../config";
import {ElementNameHandler} from "./shared/elementNameHandler";
import {CanvasEvent, NetCanvas, NetRenameEvent} from "./shared/canvas.model";
import {ElementCache} from "./shared/elementCache";

/**
 * A wrapper class around an HTML canvas that is enriched with knowledge about Petri nets.
 */
@Component({
	selector: 'app-canvas',
	templateUrl: './canvas.component.html',
	styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterViewInit, NetCanvas {
	name = "new"
	id = ""

	canvas: fabric.Canvas = new fabric.Canvas(null)

	lastSelected?: fabric.Object

	isLocked = false
	isDeadlocked = false // show notice on canvas if deadlocked
	elementCache = new ElementCache()

    namesAreDisplayed = false
    nameHandler = new ElementNameHandler()

	isDirty = true

    @ViewChild('htmlCanvasElement') canvasElement!: ElementRef<HTMLCanvasElement>

    @Output()
    mouseEventEmitter = new EventEmitter<CanvasEvent>
	@Output()
	netRenameEmitter = new EventEmitter<NetRenameEvent>

    ngAfterViewInit() {
        this.canvas = new fabric.Canvas(this.canvasElement.nativeElement)
		this.setupCanvas()
        // mouse:down is a special event
		this.canvas.on('mouse:down', e => this.onClick(e))

	    this.canvas.on('selection:created', e => this.onSelectCreate(e))
	    this.canvas.on('selection:cleared', e => this.onSelectClear(e))
	    this.canvas.on('object:moving', e => this.onObjectMoving(e))
	    this.canvas.on('object:modified', e => this.onObjectModified(e))
		window.addEventListener('resize', this.onWindowResize)
    }

	onWindowResize = () => {
		this.canvas.setDimensions({
			width: window.innerWidth,
			height: window.innerHeight - BaseToolbarComponent.height - WindowManagerComponent.height
		})
	}

	private setupCanvas = () => {
		this.canvas.setDimensions({
			width: window.innerWidth,
			height: window.innerHeight - BaseToolbarComponent.height - WindowManagerComponent.height
		})
		this.canvas.setBackgroundColor(canvas_color, this.canvas.renderAll.bind(this.canvas))

		// extra canvas settings
		this.canvas.renderOnAddRemove = false
		this.canvas.preserveObjectStacking = true
	}

	private onClick(event: IEvent<MouseEvent>) {
		if (this.isLocked) {
			// ignore all clicks when the editor is locked.
			return
		}

        this.mouseEventEmitter.emit({type: 'mouse:down', source: event})
    }

	addTransition = (x: number, y: number) => {
        let name = this.nameHandler.getNextTransitionName()
        let t = new Transition(x, y, name, this.canvas)
        t.showName(this.namesAreDisplayed)
		this.modifiedNet()
		this.renderAll()
		return t
	}

	addPlace = (x: number, y: number) => {
        let name = this.nameHandler.getNextPlaceName()
		let p = new Place(x, y, name, this.canvas)
        p.showName(this.namesAreDisplayed)
		this.modifiedNet()
		this.renderAll()
        return p
	}

	addArcFromLastSelected(target: fabric.Object | undefined) {
		return this.addArc(this.lastSelected, target)
	}

	addArc(source: fabric.Object | undefined, target: fabric.Object | undefined) {
		if (target instanceof Place && source instanceof Transition
			|| target instanceof Transition && source instanceof Place) {
			let arc = new Arc(source, target, this.canvas)
			source.arcs.arcs_out.push(arc)
			target.arcs.arcs_in.push(arc)

			this.modifiedNet()
			this.renderAll()

			return arc
		}

		return undefined
	}

    deleteCurrentSelection() {
        if (this.lastSelected == null) {
            return
        }

        if (this.lastSelected instanceof fabric.Group) {
            this.lastSelected.getObjects().forEach(obj => {
                this.deleteObject(obj)
            })
            this.lastSelected.destroy()
            this.canvas.remove(this.lastSelected)
            this.lastSelected.hasBorders = false
        } else {
			this.deleteObject(this.lastSelected)
			this.lastSelected = undefined
		}

        this.renderAll()
    }

	deleteObject(obj: fabric.Object | undefined) {
		if (obj instanceof Place || obj instanceof Transition || obj instanceof Arc) {
			obj.remove(this.canvas)
		}
		if (obj && this.lastSelected == obj) {
			this.lastSelected = undefined
		}
		this.modifiedNet()
	}

	addOrRemoveTokenOfCurrentSelection(tool: DrawingTools.TOKEN_INC | DrawingTools.TOKEN_INC_5 | DrawingTools.TOKEN_DEC | DrawingTools.TOKEN_DEC_5) {
        let amount = getDecIncValue(tool)

		this.getCurrentSelected().forEach(obj => {
            if (obj instanceof Place || obj instanceof Arc) {
                obj.add(amount)
            }
        })

		this.modifiedNet()

        this.renderAll()
    }

	private onSelectClear(_: IEvent<MouseEvent>) {
		// after a group was disbanded, update text position of places.
        let [places, transitions] = this.getPlacesAndTransitions()
		places.forEach(obj => obj.updateTextPosition())
		transitions.forEach(obj => obj.updateTextPosition())
		this.lastSelected = undefined
		this.renderAll()
	}

	private onObjectMoving(e: IEvent<MouseEvent>) {
		let target = e.target!
		if (target instanceof fabric.Group) {
			// TODO: fix grid placement for groups
			target.forEachObject(obj => this.moveObj(obj))
		} else {
			this.moveObj(target)
		}
		this.renderAll()
	}

	moveObj(obj: fabric.Object) {
		if (gridEnabled) {
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
            obj.updateTextPosition()
		}
	}

	private toGridCoordinate(x: number, y: number): [number, number] {
		let xGrid = Math.round(x / gridSize) * gridSize
		let yGrid = Math.round(y / gridSize) * gridSize
		return [xGrid, yGrid]
	}

    getPlacesAndTransitions(): [Place[], Transition[]] {
        if (this.elementCache.isActive) {
			return this.elementCache.getElements()
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

	lock() {
        let [places, transitions] = this.getPlacesAndTransitions()
		this.isLocked = true
		this.canvas.setBackgroundColor(canvas_color_simulating, () => {
			this.renderAll()
		})
		this.elementCache.cache(places, transitions)
	}

	unlock() {
		this.isDeadlocked = false
		this.resetTransitionHeat()
		this.canvas.setBackgroundColor(canvas_color, () => {
		})
		this.isLocked = false
		this.elementCache.flush()

		this.renderAll()
	}

	setMarking(p: number[]) {
		if (p.length == 0) return

		let [places, _] = this.getPlacesAndTransitions()
		for (let i = 0; i < places.length; i++) {
			places[i].setAmount(p[i])
		}

		this.renderAll()
	}

	setTransitionHeat(firings: number[]) {
		let [_, transitions] = this.getPlacesAndTransitions()
		let sum = Math.max(1, firings.reduce((accumulator, currentValue) => accumulator + currentValue, 0))

		firings.map(value => value / sum)
			.map(value => toHeatColor(value))
			.forEach((value, index) => {
                transitions[index].set({fill: value})
			})

		this.renderAll()
	}

	private resetTransitionHeat() {
		let transitions = this.getTransitions()
		transitions.forEach(transition => {
			transition.set({fill: fill_color})
		})

		this.renderAll()
	}

	private onSelectCreate(e: IEvent<MouseEvent>) {
		let group = e.selected![0]!.group
		if (group == undefined) {
			return
		}

		group.set(baseOptions)
		group.getObjects().forEach(obj => {
			if (obj instanceof Arc || obj instanceof Place || obj instanceof Transition) {
				obj.handleGrouping(group!)
			}
		})

        this.lastSelected = group
		this.renderAll()
	}

    getAllElements(): Object[] {
        return this.canvas.getObjects()
            .filter(value => [Transition, Place, Arc].some(clazz => value instanceof clazz))
    }

	loadNet(net: NetDTO, loadDirty: boolean): void {
		this.deleteAllElements()
		let map = new Map<string, Transition | Place>()
		net.places.forEach(place => {
			let p = this.addPlace(place.position.x, place.position.y)
			p.setAmount(place.initialMarking)
			p.id = place.id
            p.setInfoText(place.infoText)
			map.set(p.id, p)
		})
		net.transitions.forEach(transition => {
			let t = this.addTransition(transition.position.x, transition.position.y)
			t.id = transition.id
            t.setInfoText(transition.infoText)
			map.set(t.id, t)
		})
		net.arcs.forEach(arc => {
			let from = map.get(arc.source)
			let to = map.get(arc.target)

			let a = this.addArc(from, to)
			if (a == undefined) return;

			a.weight = +arc.text
			a.id = arc.id
            a.setInfoText(arc.infoText)
		})

		this.id = net.id
		this.name = net.name
		this.isDirty = loadDirty
		this.emitNameChange()

		this.renderAll();
	}

	private modifiedNet(): void {
		if (this.isDirty) return

		this.isDirty = true
		this.emitNameChange()
	}

	savedNet(name: string): void {
		this.name = name
		this.isDirty = false
		this.emitNameChange()
	}

	private emitNameChange() {
		this.netRenameEmitter.emit({
			name: this.name,
			dirty: this.isDirty,
		})
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

    toggleNames() {
        this.namesAreDisplayed = !this.namesAreDisplayed
        this.updateShowNames()
        this.renderAll()
    }

    private updateShowNames() {
        this.getPlaces().forEach(p => p.showName(this.namesAreDisplayed))
        this.getTransitions().forEach(t => t.showName(this.namesAreDisplayed))
    }

	private deleteAllElements(): void {
		this.canvas.getObjects().forEach(obj => {
			if (obj instanceof Transition || obj instanceof Place) {
				obj.remove(this.canvas)
			}
		})

		this.modifiedNet()
		this.renderAll()
	}

    private onObjectModified(e: IEvent<MouseEvent>) {
        if (e.target instanceof Text) {
            e.target.updateFromText()
			this.modifiedNet()
        }
    }

    private renderAll() {
        this.canvas.requestRenderAll()
    }

    getCurrentSelected() {
        if (this.lastSelected === undefined) {
            return []
        }
        if (this.lastSelected instanceof fabric.Group) {
            return this.lastSelected.getObjects()
        }

        return [this.lastSelected]
    }
}
