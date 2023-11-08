import {fabric} from "fabric";

export enum DrawingTools {
	SELECT = 'SELECT',
	TRANSITION = 'TRANSITION',
	PLACE = 'PLACE',
	ARC = 'ARC',
	TEXT = 'TEXT',
	GARBAGE = 'GARBAGE',
	RUN = 'RUN',
}

export class Transition extends fabric.Rect {
	arcs: Connectable = new Connectable()

	constructor(x: number, y: number, canvas: fabric.Canvas) {
		super({
			left: x,
			top: y,
			fill: '#ffffff',
			width: 80,
			height: 50,
			originX: 'center',
			originY: 'center',
			strokeWidth: 1,
			stroke: '#000000',
			lockRotation: true,
			lockScalingX: true,
			lockScalingY: true,
		});
		canvas.add(this)
	}
}

export class Place extends fabric.Circle {
	tokens= 0
	tokenText: fabric.Text
	arcs: Connectable = new Connectable()

	textDx = -11;
	textDy = -22;

	constructor(x: number, y: number, canvas: fabric.Canvas) {
		super({
			left: x,
			top: y,
			fill: '#ffffff',
			radius: 30,
			originX: 'center',
			originY: 'center',
			strokeWidth: 1,
			stroke: '#000000',
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

	deleteText(canvas: fabric.Canvas) {
		canvas.remove(this.tokenText)
	}
}

export class Arc extends fabric.Line {
	constructor(sx: number, sy: number, tx: number, ty: number, canvas: fabric.Canvas) {
		super([sx, sy, tx, ty], {
			fill: '#ffffff',
			borderColor: '#000000',
			originX: 'center',
			originY: 'center',
			strokeWidth: 1,
			stroke: '#000000',
			selectable: false,
		})
		canvas.add(this)
	}
}

export class Connectable {
	arcs_in: Arc[] = []
	arcs_out: Arc[] = []
}
