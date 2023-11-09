import {AfterContentInit, Component, ViewChild} from '@angular/core';
import {fabric} from 'fabric';
import {IEvent} from "fabric/fabric-impl";
import {ToolbarComponent} from "../toolbar/toolbar.component";
import {Arc, DrawingTools, Place, Transition} from "../models";
import {SimulatorService} from "../simulator.service";

@Component({
	selector: 'app-canvas',
	templateUrl: './canvas.component.html',
	styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements AfterContentInit {
	canvas: fabric.Canvas = new fabric.Canvas('canvas');
	selected?: fabric.Object | undefined;
	lastSelected?: fabric.Object | undefined;

	@ViewChild('toolbar') toolbar!: ToolbarComponent

	constructor(private simulatorService: SimulatorService) {}

	ngAfterContentInit() {
		this.canvas = new fabric.Canvas('canvas');
		this.setupCanvas()
		this.canvas.on('mouse:down', (event) => this.onClick(event))
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

	onClick(event: IEvent<MouseEvent>) {
		let x = event.e.offsetX
		let y = event.e.offsetY
		switch (this.toolbar.selected) {
			case DrawingTools.PLACE: {
				this.addCircle(x, y);
				break;
			}
			case DrawingTools.TRANSITION: {
				this.addRect(x, y);
				break;
			}
			case DrawingTools.TOKEN_INC:
			case DrawingTools.TOKEN_DEC: {
				let obj = event.target
				if (obj instanceof Place) {
					this.updatePlaceTokens(this.toolbar.selected, obj)
					this.canvas.renderAll()
				}
				break;
			}
		}
	}

	addRect = (x: number, y: number) => {
		new Transition(x, y, this.canvas)
	}

	addCircle = (x: number, y: number) => {
		new Place(x, y, this.canvas)
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
				this.deleteObject(obj);
				break;
			}
		}
	}

	private deleteObject(obj: fabric.Object) {
		if (obj instanceof Place || obj instanceof Transition) {
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
				this.canvas.remove(obj);
				break;
			}
			case DrawingTools.ARC: {
				if (obj instanceof Place && lastObj instanceof Transition
					|| obj instanceof Transition && lastObj instanceof Place) {
					let arc = new Arc(lastObj, obj, this.canvas)
					lastObj.arcs.arcs_out.push(arc)
					obj.arcs.arcs_in.push(arc)
				}
				break;
			}
		}
		this.lastSelected = this.selected
		this.selected = obj
	}

	private updatePlaceTokens(mode: DrawingTools.TOKEN_INC | DrawingTools.TOKEN_DEC, place: Place) {
		if (mode == DrawingTools.TOKEN_INC) {
			place.addToken()
		} else {
			place.removeToken()
		}
	}

	private selectClear(_: IEvent<MouseEvent>) {
		this.lastSelected = undefined;
		this.selected = undefined;
	}

	private objectMoving(e: IEvent<MouseEvent>) {
		let obj = e.target!
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
		this.canvas.renderAll()
	}

	controlChanged(command: DrawingTools) {
		if (command != DrawingTools.RUN) {
			return;
		}

		let [places, transitions] = this.getPlacesAndTransitions(this.canvas.getObjects())
		let [p, pxt_in, pxt_out] = this.toMatrix(places, transitions);
		this.callSimulate(p, pxt_in, pxt_out, 1000000);
	}

	getPlacesAndTransitions(objects: fabric.Object[]): [Place[], Transition[]] {
		let places: Place[] = [];
		let transitions: Transition[] = [];

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

	toMatrix(places: Place[], transitions: Transition[]): [number[], number[][], number[][]] {
		let pxt_in: number[][] = []
		let pxt_out: number[][] = []

		const p = places.map(p => p.tokens)
		const place_to_index = new Map<string, number>(places.map((p, i) => [p.id,i]))

		transitions.forEach(transition => {
			console.log(transition)
			let t_in_array = Array(p.length).fill(0);
			let t_out_array = Array(p.length).fill(0);
			transition.arcs.arcs_out.forEach(arc => t_out_array[place_to_index.get(arc.to.id)!] = arc.weight)
			transition.arcs.arcs_in.forEach(arc => t_in_array[place_to_index.get(arc.from.id)!] = arc.weight)
			pxt_in.push(t_in_array)
			pxt_out.push(t_out_array)
		})

		console.log(pxt_in, pxt_out)
		return [p, pxt_in, pxt_out]
	}

	async callSimulate(p: number[], pxt_in: number[][], pxt_out: number[][], steps: number) {
		console.log(p, pxt_in, pxt_out, steps)
		const result = await this.simulatorService.sendToSimulator(p, pxt_in, pxt_out, steps);
		console.log('Result from Tauri:', result);
	}
}
