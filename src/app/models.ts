import {fabric} from "fabric";

export enum DrawingTools {
	SELECT = 'SELECT',
	TRANSITION = 'TRANSITION',
	PLACE = 'PLACE',
	ARC = 'ARC',
	TEXT = 'TEXT',
	GARBAGE = 'GARBAGE',
}

export class Transition extends fabric.Rect {
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

