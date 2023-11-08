import {AfterContentInit, Component, ViewChild} from '@angular/core';
import {fabric} from 'fabric';
import {IEvent} from "fabric/fabric-impl";
import {ToolbarComponent} from "../toolbar/toolbar.component";
import {Arc, DrawingTools, Place, Transition} from "../models";

@Component({
	selector: 'app-canvas',
	templateUrl: './canvas.component.html',
	styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterContentInit {
	canvas: fabric.Canvas = new fabric.Canvas('canvas');
	selected?: fabric.Object | undefined;
	lastSelected?: fabric.Object | undefined;
	color: any;

	@ViewChild('toolbar') toolbar!: ToolbarComponent

	constructor() {
	}

	ngAfterContentInit() {
		this.canvas = new fabric.Canvas('canvas');
		this.setupCanvas()
		this.canvas.on('mouse:down', (event) => this.placeObject(event))
		this.canvas.on('selection:created', (e) => this.selectCreate(e))
		this.canvas.on('selection:updated', (e) => this.selectUpdate(e))
		this.canvas.on('selection:cleared', (e) => this.selectClear(e))
		this.canvas.on('object:moving', (e) => this.objectMoving(e))
		window.addEventListener('resize', this.onWindowResize);
	}

	setupCanvas = () => {
		this.canvas.setDimensions({
			width: window.innerWidth,
			height: window.innerHeight
		});
		this.canvas.setBackgroundColor('#fcfcfc', this.canvas.renderAll.bind(this.canvas));

		// extra canvas settings
		this.canvas.preserveObjectStacking = true;
		this.canvas.stopContextMenu = true;
		this.addRect(100, 100)
	}

	placeObject(event: IEvent<MouseEvent>) {
		let x = event.e.offsetX
		let y = event.e.offsetY
		switch (this.toolbar.selected) {
			case DrawingTools.PLACE: {
				this.addCircle(x, y)
				break
			}
			case DrawingTools.TRANSITION: {
				this.addRect(x, y)
			}
		}
	}

	addRect = (x: number, y: number) => {
		let rect = new Transition(x, y)
		this.canvas.add(rect);
	}

	addCircle = (x: number, y: number) => {
		let circle = new Place(x, y)
		this.canvas.add(circle);
	}

	onWindowResize = () => {
		this.canvas.setDimensions({
			width: window.innerWidth,
			height: window.innerHeight
		});
	}

	private selectCreate(e: IEvent<MouseEvent>) {
		let obj = e.selected!![0]
		switch (this.toolbar.selected) {
			case DrawingTools.GARBAGE: {
				this.deleteObject(obj)
			}
		}
	}

	private deleteObject(obj: fabric.Object) {
		this.canvas.remove(obj)
		console.log(obj.type)
		if (obj instanceof Place || obj instanceof Transition) {
			console.log("deleting...")
			obj.arcs.arcs_in.forEach(arc => this.canvas.remove(arc))
			obj.arcs.arcs_out.forEach(arc => this.canvas.remove(arc))
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
				this.canvas.remove(obj);
				break;
			}
			case DrawingTools.ARC: {
				if (obj instanceof Place && lastObj instanceof Transition
					|| obj instanceof Transition && lastObj instanceof Place) {
					let arc = new Arc(lastObj.left!!, lastObj.top!!, obj.left!!, obj.top!!)
					lastObj.arcs.arcs_out.push(arc)
					obj.arcs.arcs_in.push(arc)
					this.canvas.add(arc)
					this.canvas.sendToBack(arc)
				}
			}
		}
		this.lastSelected = this.selected
		this.selected = obj
	}

	private selectClear(e: IEvent<MouseEvent>) {
		this.lastSelected = undefined;
		this.selected = undefined;
	}

	private objectMoving(e: IEvent<MouseEvent>) {
		let obj = e.target!
		if (obj instanceof Place || obj instanceof Transition) {
			obj.arcs.arcs_out.forEach(arc => {
				arc.set({x1: obj.left, y1: obj.top})
				arc.setCoords()
			})
			obj.arcs.arcs_in.forEach(arc => {
				arc.set({x2: obj.getCenterPoint().x, y2: obj.getCenterPoint().y})
				arc.setCoords()
			})
		}
		this.canvas.renderAll()
	}
}
