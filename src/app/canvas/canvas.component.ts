import {AfterContentInit, Component, ViewChild} from '@angular/core';
import {fabric} from 'fabric';
import {IEvent} from "fabric/fabric-impl";
import {ToolbarComponent} from "../toolbar/toolbar.component";
import {DrawingTools, Place, Transition} from "../models";

@Component({
	selector: 'app-canvas',
	templateUrl: './canvas.component.html',
	styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterContentInit {
	canvas: fabric.Canvas = new fabric.Canvas('canvas');
	activeObject?: fabric.Object | undefined;
	lastSelected?: fabric.Object | undefined;
	color: any;

	@ViewChild('toolbar') toolbar!: ToolbarComponent

	constructor() {
	}

	ngAfterContentInit() {
		this.canvas = new fabric.Canvas('canvas');
		this.setupCanvas()
		this.canvas.on('mouse:down', (event) => this.placeObject(event))
		// this.canvas.on('object:selected', (e) => this.)
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
		console.log(this.toolbar.selected)
		console.log(event.e.clientX, event.e.clientY)
		// this.addRect(event.e.x, event.e.pageY)
		// this.addRect(event.e.x, event.e.screenY)
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
}
