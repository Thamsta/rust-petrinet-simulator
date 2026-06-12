import {AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild, ChangeDetectionStrategy} from '@angular/core'
import { ActiveSelection, Canvas, FabricObject, Group } from 'fabric'
import type { TPointerEventInfo, TPointerEvent } from 'fabric'
import {DrawingTools, getDecIncValue} from "../editor-toolbar/editor-toolbar.models"
import {Arc, baseOptions, isNetElement, NetElement, Place, Text, Transition} from "../elements"
import {canvas_color, canvas_color_simulating, toHeatColor} from "../colors"
import {ArcDTO, NetDTO, PlaceDTO, TransitionDTO} from "../dtos";
import {BaseToolbarComponent} from "../base-toolbar/base-toolbar.component";
import {WindowManagerComponent} from "../window-manager/window-manager.component";
import {gridEnabled, gridSize} from "../config";
import {ElementNameHandler} from "./shared/elementNameHandler";
import {CanvasEvent, NetCanvas, NetRenameEvent} from "./shared/canvas.model";
import {ElementCache} from "./shared/elementCache";
import {ImportService} from "./shared/import.service";

@Component({
    selector: 'app-canvas',
    templateUrl: './canvas.component.html',
    styleUrls: ['./canvas.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CanvasComponent implements AfterViewInit, NetCanvas {
	name = "new"
	id = ""

	canvas: Canvas = new Canvas(null as any)

	lastSelected?: FabricObject

	isLocked = false
	isDeadlocked = false

	elementCache = new ElementCache()
	importer = new ImportService(this)

    namesAreDisplayed = false
    nameHandler = new ElementNameHandler()

	isDirty = true

    @ViewChild('htmlCanvasElement') canvasElement!: ElementRef<HTMLCanvasElement>

    @Output()
    mouseEventEmitter = new EventEmitter<CanvasEvent>
	@Output()
	netRenameEmitter = new EventEmitter<NetRenameEvent>

    ngAfterViewInit() {
        this.canvas = new Canvas(this.canvasElement.nativeElement)
		this.setupCanvas()
        this.canvas.on('mouse:down', (e: TPointerEventInfo<TPointerEvent>) => this.onClick(e))
	    this.canvas.on('selection:created', (e: { selected?: FabricObject[] }) => this.onSelectCreate(e))
	    this.canvas.on('selection:cleared', () => this.onSelectClear())
	    this.canvas.on('object:moving', (e: { target?: FabricObject }) => this.onObjectMoving(e))
	    this.canvas.on('object:modified', (e: { target?: FabricObject }) => this.onObjectModified(e))
		window.addEventListener('resize', this.onWindowResize)
    }

	onWindowResize = () => {
		this.canvas.setDimensions({
			width: window.innerWidth,
			height: window.innerHeight - BaseToolbarComponent.height - WindowManagerComponent.height
		})
	}

	private setupCanvas = () => {
		this.onWindowResize()
		this.canvas.backgroundColor = canvas_color
		this.canvas.requestRenderAll()

		this.canvas.renderOnAddRemove = false
		this.canvas.preserveObjectStacking = true
	}

	private onClick(event: TPointerEventInfo<TPointerEvent>) {
		if (this.isLocked) {
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

	addArcFromLastSelected(target: FabricObject | undefined) {
		return this.addArc(this.lastSelected, target)
	}

	addArc(source: FabricObject | undefined, target: FabricObject | undefined) {
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

        if (this.lastSelected instanceof Group) {
            this.lastSelected.getObjects().forEach(obj => {
                this.deleteObject(obj)
            })
            this.canvas.remove(this.lastSelected)
            this.lastSelected.hasBorders = false
        } else {
			this.deleteObject(this.lastSelected)
			this.lastSelected = undefined
		}

		this.canvas.discardActiveObject()
        this.renderAll()
    }

	deleteObject(obj: FabricObject | undefined) {
		if (isNetElement(obj)) {
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

	private onSelectClear() {
        let [places, transitions] = this.getPlacesAndTransitions()
		places.forEach(obj => obj.updateTextPosition())
		transitions.forEach(obj => obj.updateTextPosition())
		this.lastSelected = undefined
		this.renderAll()
	}

	private onObjectMoving(e: { target?: FabricObject }) {
		let target = e.target!
		if (target instanceof Group) {
			target.forEachObject(obj => this.moveObj(obj))
		} else {
			this.moveObj(target)
		}
		this.renderAll()
	}

	moveObj(obj: FabricObject) {
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

	lock() {
        let [places, transitions] = this.getPlacesAndTransitions()
		this.isLocked = true
		this.canvas.backgroundColor = canvas_color_simulating
		this.renderAll()
		this.elementCache.cache(places, transitions)
	}

	unlock() {
		this.isDeadlocked = false
		this.resetTransitionHeat()
		this.canvas.backgroundColor = canvas_color
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
			transition.set({fill: transition.color})
		})

		this.renderAll()
	}

	onSelectCreate(e: { selected?: FabricObject[] }) {
		let group = e.selected?.[0]?.group
		if (group == undefined) {
			return
		}

		let objects = group.getObjects().filter(it => it instanceof Place || it instanceof Transition)
		if (objects.length == group.getObjects().length) {
			this.handleGrouping(group)
			return
		}

		this.canvas.discardActiveObject()

		let activeSelection = new ActiveSelection(objects)
		this.canvas.setActiveObject(activeSelection)
	}

	handleGrouping(group: Group) {
		group.set(baseOptions)
		group.getObjects().forEach(obj => {
			if (isNetElement(obj)) {
				obj.handleGrouping(group!)
			}
		})

		this.lastSelected = group
		this.renderAll()
	}

	loadNet(net: NetDTO, loadDirty: boolean): void {
		this.deleteAllElements()

		this.importer.loadNet(net)

		this.id = net.id
		this.isDirty = loadDirty
		this.name = net.name
		this.emitNameChange()
		this.renderAll();
	}

	insertDTOs(places: PlaceDTO[], transitions: TransitionDTO[], arcs: ArcDTO[]) {
		return this.importer.loadElements(places, transitions, arcs, false)
	}

	private modifiedNet(): void {
		if (this.isDirty) return

		this.isDirty = true
		this.emitNameChange()
	}

	onSavedNet(name: string): void {
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

	getAllElements(): NetElement[] {
		return this.canvas.getObjects()
			.filter(obj => isNetElement(obj))
			.map(obj => obj as NetElement)
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

	getCurrentSelected() {
		if (this.lastSelected === undefined) {
			return []
		}
		if (this.lastSelected instanceof Group) {
			return this.lastSelected.getObjects()
		}

		return [this.lastSelected]
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

	deleteAllElements(): void {
		this.canvas.getObjects().forEach(obj => {
			if (obj instanceof Transition || obj instanceof Place) {
				obj.remove(this.canvas)
			}
		})

		this.modifiedNet()
		this.renderAll()
	}

    private onObjectModified(e: { target?: FabricObject }) {
        if (e.target instanceof Text) {
            e.target.updateFromText()
			this.modifiedNet()
        }
    }

    renderAll() {
		console.debug("Manual render called.")
        this.canvas.requestRenderAll()
    }
}
