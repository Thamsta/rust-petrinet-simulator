import {fabric} from "fabric";
import {Line} from "fabric/fabric-impl";

export enum DrawingTools {
	SELECT = 'SELECT',
	TRANSITION = 'TRANSITION',
	PLACE = 'PLACE',
	ARC = 'ARC',
	TEXT = 'TEXT',
	GARBAGE = 'GARBAGE',
}

export class Transition extends fabric.Rect {
	arcs: Connectable = new Connectable()

	constructor(x: number, y: number) {
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
		});
	}
}

export class Place extends fabric.Circle {
	tokens= 0
	arcs: Connectable = new Connectable()

	constructor(x: number, y: number) {
		super({
			left: x,
			top: y,
			fill: '#ffffff',
			borderColor: '#000000',
			radius: 30,
			originX: 'center',
			originY: 'center',
			strokeWidth: 1,
			stroke: '#000000',
		})
	}
}

export class Arc extends fabric.Line {
	constructor(sx: number, sy: number, tx: number, ty: number) {
		super([sx, sy, tx, ty], {
			fill: '#ffffff',
			borderColor: '#000000',
			originX: 'center',
			originY: 'center',
			strokeWidth: 1,
			stroke: '#000000',
			selectable: false,
		})
	}
}

export class Connectable {
	arcs_in: Arc[] = []
	arcs_out: Arc[] = []
}

