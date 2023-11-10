import {fabric} from "fabric";
import {Canvas} from "fabric/fabric-impl";
import { v4 as uuidv4 } from 'uuid';

export enum DrawingTools {
	SELECT = 'SELECT',
	GARBAGE = 'GARBAGE',
	TRANSITION = 'TRANSITION',
	PLACE = 'PLACE',
	ARC = 'ARC',
	TOKEN_INC = 'TOKEN_INC',
	TOKEN_DEC = 'TOKEN_DEC',
	RUN = 'RUN',
	STEP = 'STEP',
	STOP = 'STOP',
	PAUSE = 'PAUSE',
}

export type SimulationResponse = {
	marking: number[],
	firings: number[],
}

export function isRunCommand(tool: DrawingTools): Boolean {
	return Object.values([DrawingTools.RUN, DrawingTools.STEP, DrawingTools.STOP, DrawingTools.PAUSE]).includes(tool)
}

export const line_color = '#282828'
export const fill_color = '#ffffff'
export const max_heat_color = '#ff8700'

interface Removable {
	remove(canvas: fabric.Canvas): void
}

class Connectable implements Removable {
	arcs_in: Arc[] = []
	arcs_out: Arc[] = []

	remove(canvas: fabric.Canvas) {
		this.arcs_in.forEach(arc => arc.remove(canvas))
		this.arcs_out.forEach(arc => arc.remove(canvas))
	}
}

interface Point {
	x: number;
	y: number;
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

	setColor(color: string) {
		this.fill = color
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
        canvas.remove(this, this.tokenText)
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

	setTokens(tokens: number) {
		this.tokens = tokens;
		this.updateText()
	}

	private updateText() {
		this.tokenText.set({text: String(this.tokens)})
	}
}

const options = {
	originX: 'center',
	originY: 'center',
	strokeWidth: 1,
	stroke: line_color,
	selectable: false,
}

export class Arc extends fabric.Line implements Removable {
	id = uuidv4();

	from: Place | Transition;
	to: Place | Transition;
	weight = 1

	arrowArc1: fabric.Line;
	arrowArc2: fabric.Line;

	constructor(from: Place | Transition, to: Place | Transition, canvas: fabric.Canvas) {
		super([from.left!, from.top!, to.left!, to.top!], options);

		let lineP2 = this.shortenLine({x: from.left!, y: from.top!}, {x: to.left!, y: to.top!}, 30)

		let [a1, a2] = this.calculateArrowhead({x: from.left!, y:from.top!}, lineP2, 20)

		this.arrowArc1 = new fabric.Line([lineP2.x, lineP2.y, a1.x, a1.y], options)
		this.arrowArc2 = new fabric.Line([lineP2.x, lineP2.y, a2.x, a2.y], options)

		this.from = from;
		this.to = to;
		canvas.add(this, this.arrowArc1, this.arrowArc2);
		canvas.sendToBack(this);
	}

	remove(canvas: fabric.Canvas): void {
        canvas.remove(this, this.arrowArc1, this.arrowArc2)
    }

	updateLinePoints() {
		let lineStart: Point = {x: this.from.left!, y: this.from.top!}
		let target: Point = {x: this.to.left!, y: this.to.top!}
		let lineEnd: Point = this.shortenLine(lineStart, target, 30)
		let [a1, a2] = this.calculateArrowhead(lineStart, lineEnd, 25)
		//super.set({x1: lineStart.x, y1: lineStart.y, x2: lineEnd.x, y2: lineEnd.y})
		this.arrowArc1.set({x1: lineEnd.x, y1: lineEnd.y, x2: a1.x, y2: a1.y})
		this.arrowArc2.set({x1: lineEnd.x, y1: lineEnd.y, x2: a2.x, y2: a2.y})
		this.arrowArc1.setCoords()
		this.arrowArc2.setCoords()
		this.setCoords()
	}

	shortenLine(p1: Point, p2: Point, lengthToShorten: number): Point {
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		const lineLength = Math.sqrt(dx * dx + dy * dy);

		// If line is too short, return p1 as the endpoint
		if (lineLength <= lengthToShorten) {
			return { x: p1.x, y: p1.y };
		}

		// Shorten the line by the specified length
		const shortenedLength = lineLength - lengthToShorten;
		const shortenedX = p1.x + (dx / lineLength) * shortenedLength;
		const shortenedY = p1.y + (dy / lineLength) * shortenedLength;

		return { x: shortenedX, y: shortenedY };
	}

	calculateArrowhead(start: Point, end: Point, arrowLength: number = 10, arrowAngle: number = 20): [Point, Point] {
		const angle = Math.atan2(end.y - start.y, end.x - start.x);

		const angleRad = (arrowAngle * Math.PI) / 180;

		const dx1 = arrowLength * Math.cos(angle + angleRad);
		const dy1 = arrowLength * Math.sin(angle + angleRad);
		const arrowTip1 = { x: end.x - dx1, y: end.y - dy1 };

		const dx2 = arrowLength * Math.cos(angle - angleRad);
		const dy2 = arrowLength * Math.sin(angle - angleRad);
		const arrowTip2 = { x: end.x - dx2, y: end.y - dy2 };

		return [arrowTip1, arrowTip2];
	}
}
