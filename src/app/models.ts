import {fabric} from "fabric";
import {Canvas} from "fabric/fabric-impl";
import { v4 as uuidv4 } from 'uuid';

export enum DrawingTools {
	SELECT = 'SELECT',
	GARBAGE = 'GARBAGE',
	TRANSITION = 'TRANSITION',
	PLACE = 'PLACE',
	ARC = 'ARC',
	TEXT = 'TEXT',
	TOKEN_INC = 'TOKEN_INC',
	TOKEN_DEC = 'TOKEN_DEC',
	RUN = 'RUN',
}

const line_color = '#282828'
const fill_color = '#ffffff'

export interface Removable {
	remove(canvas: fabric.Canvas): void
}

export class Transition extends fabric.Rect implements Removable {
	id = uuidv4();

	arcs: Connectable = new Connectable()

	constructor(x: number, y: number, canvas: fabric.Canvas) {
		super({
			left: x,
			top: y,
			fill: fill_color,
			width: 80,
			height: 50,
			originX: 'center',
			originY: 'center',
			strokeWidth: 1,
			stroke: line_color,
			lockRotation: true,
			lockScalingX: true,
			lockScalingY: true,
		});
		canvas.add(this)
	}

	remove(canvas: Canvas): void {
		canvas.remove(this)
		this.arcs.remove(canvas)
	}
}

export class Place extends fabric.Circle implements Removable {
	id = uuidv4();

	tokens= 0
	tokenText: fabric.Text
	arcs: Connectable = new Connectable()

	textDx = -11;
	textDy = -22;

	constructor(x: number, y: number, canvas: fabric.Canvas) {
		super({
			left: x,
			top: y,
			fill: fill_color,
			radius: 30,
			originX: 'center',
			originY: 'center',
			strokeWidth: 1,
			stroke: line_color,
			lockRotation: true,
			lockScalingX: true,
			lockScalingY: true,
		})
		this.tokenText = new fabric.Text("0", {
			textAlign: 'center',
			selectable: false,
			lockRotation: true,
		})
		this.moveText()
		canvas.add(this.tokenText)
		canvas.bringToFront(this.tokenText)
		canvas.add(this)
		canvas.sendBackwards(this)
	}

	remove(canvas: fabric.Canvas): void {
        canvas.remove(this)
		canvas.remove(this.tokenText)
		this.arcs.remove(canvas)
    }

	moveText() {
		this.tokenText.set({
			left: this.left! + this.textDx,
			top: this.top! + this.textDy,
		})
	}

	addToken() {
		this.tokens++;
		this.updateText()
	}

	removeToken() {
		if (this.tokens > 0) {
			this.tokens--;
		}
		this.updateText()
	}

	updateText() {
		this.tokenText.set({text: String(this.tokens)})
	}
}

export class Arc extends fabric.Line {
	id = uuidv4();

	from: Place | Transition;
	to: Place | Transition;
	weight = 1


	constructor(from: Place | Transition, to: Place | Transition, canvas: fabric.Canvas) {
		super([from.top!, from.left!, to.top!, to.left!], {
			originX: 'center',
			originY: 'center',
			strokeWidth: 1,
			stroke: line_color,
			selectable: false,
		});
		this.from = from;
		this.to = to;
		canvas.add(this);
		canvas.sendToBack(this);
	}
}

class Connectable implements Removable {
	arcs_in: Arc[] = []
	arcs_out: Arc[] = []

	remove(canvas: fabric.Canvas) {
		this.arcs_in.forEach(arc => canvas.remove(arc))
		this.arcs_out.forEach(arc => canvas.remove(arc))
	}
}
