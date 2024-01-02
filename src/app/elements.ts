import {fabric} from "fabric";
import {v4 as uuidv4} from "uuid";
import {fill_color, line_color} from "./colors";
import {Canvas} from "fabric/fabric-impl";

/**
 * Represents an element that should not be included in a group selection.
 * Always call this interface's method to remove it from a group.
 * @interface
 */
interface Ungroupable {
    removeFromGroup(group: fabric.Group): void
}

/**
 * Represents an element that can be included in a group selection and
 * has special behaviour that needs to be considered when it is added
 * to a group.
 * @interface
 */
interface Groupable {
    addToGroup(group: fabric.Group): void
}

/**
 * Represents an element which has special behaviour that needs to be
 * considered when it is removed.
 * @interface
 */
interface Removable {
    remove(canvas: fabric.Canvas): void
}

/**
 * Represents an element which has a countable element that can be in- and
 * decremented.
 * @interface
 */
interface Countable {
    increment(): void
    decrement(): void
    setAmount(amount: number): void
}

/**
 * A point of cartesian coordinates.
 * @interface
 */
interface Point {
    x: number;
    y: number;
}

/**
 * Class that contains ingoing and outgoing arc, to be added to connectable elements
 * @class
 * @implements Removable
 */
class Connectable implements Removable {
    arcs_in: Arc[] = []
    arcs_out: Arc[] = []

    remove(canvas: fabric.Canvas) {
        this.arcs_in.forEach(arc => arc.remove(canvas))
        this.arcs_out.forEach(arc => arc.remove(canvas))
    }
}

// Options that are shared amongst all elements
export const baseOptions = {
	lockScalingY: true,
	lockScalingX: true,
	lockRotation: true,
	hasControls: false,
    borderScaleFactor: 1,
    borderColor: '#bbbbbb',
	strokeWidth: 1,
	stroke: line_color,
}

// Options for elements that are not movable by the user
const immovableOptions = {
	hasBorders: false,
	lockMovementX: true,
	lockMovementY: true,
}

// Options for transitions
const transitionOptions = {
	fill: fill_color,
	width: 80,
	height: 50,
	originX: 'center',
	originY: 'center',
	...baseOptions,
}

// Options for places
const placeOptions = {
	fill: fill_color,
	radius: 30,
	originX: 'center',
	originY: 'center',
	...baseOptions,
}

// Options for lines
const lineOptions = {
	originX: 'center',
	originY: 'center',
	...immovableOptions,
	...baseOptions,
}

// Default options for text.
const textOptions = {
	textAlign: 'center',
	...immovableOptions,
	...baseOptions,
    strokeWidth: 0,
}

/**
 * Represents a Transition
 * @class
 * @implements Removable
 */
export class Transition extends fabric.Rect implements Removable {
    id = uuidv4();

    arcs: Connectable = new Connectable()

    constructor(x: number, y: number, canvas: fabric.Canvas) {
        super({
            left: x,
            top: y,
            ...transitionOptions,
        });
        canvas.add(this)
    }

    remove(canvas: Canvas): void {
        canvas.remove(this)
        this.arcs.remove(canvas)
    }
}

/**
 * Represents a Place. Has a number of tokens which can be changed.
 * @class
 * @implements {Removable, Countable, Groupable}
 */
export class Place extends fabric.Circle implements Removable, Countable, Groupable {
    id = uuidv4();

    tokens= 0
    tokenText: Text
    arcs: Connectable = new Connectable()

    textDx = -11;
    textDy = -22;

    constructor(x: number, y: number, canvas: fabric.Canvas) {
        super({
            left: x,
            top: y,
            ...placeOptions
        })
        this.tokenText = new Text("", this)
        this.updateText()
        this.updateTextPosition()
        canvas.add(this)
        canvas.add(this.tokenText)
        canvas.sendBackwards(this)
        canvas.bringToFront(this.tokenText)
    }

    addToGroup(group: fabric.Group): void {
        group.add(this.tokenText)
        this.updateTextPosition() // recalculate text so it uses the relative coordinates of the group
    }

    remove(canvas: fabric.Canvas): void {
        canvas.remove(this, this.tokenText)
        this.arcs.remove(canvas)
    }

    updateTextPosition() {
        const tokenLength = this.tokens.toString().length - 1;
        this.tokenText.set({
            left: this.left! + this.textDx - (tokenLength * 11),
            top: this.top! + this.textDy,
        })
    }

    increment() {
        this.tokens++;
        this.updateText()
    }

    decrement() {
        if (this.tokens > 0) {
            this.tokens--;
        }
        this.updateText()
    }

    setAmount(tokens: number) {
        this.tokens = tokens;
        this.updateText()
    }

    updateTextFromString(text: string) {
        this.tokens = +text.replaceAll(/\D/g, '')
        this.updateText()
    }

    private updateText() {
        let text = this.tokens == 0 ? "" : String(this.tokens)
        this.tokenText.set({text: text})
        this.updateTextPosition()
    }
}

/**
 * Represents an Arc that connects a Place and a Transition
 * @class
 * @implements {Removable, Countable, Ungroupable}
 */
export class Arc extends fabric.Line implements Removable, Countable, Ungroupable {
    id = uuidv4();

    from: Place | Transition;
    to: Place | Transition;
    weight = 1
    weightText: Text

    arrowArc1: fabric.Line;
    arrowArc2: fabric.Line;

    constructor(from: Place | Transition, to: Place | Transition, canvas: fabric.Canvas) {
        super([from.left!, from.top!, to.left!, to.top!], lineOptions);

        this.weightText = new Text(this.weight.toString(), this)
        this.arrowArc1 = new fabric.Line([0,0,0,0], lineOptions) // use any coordinates, will be updated later
        this.arrowArc2 = new fabric.Line([0,0,0,0], lineOptions)

        this.from = from;
        this.to = to;

        this.updateLinePoints()
        this.updateText()

        canvas.add(this, this.arrowArc1, this.arrowArc2, this.weightText);
        canvas.sendToBack(this);
        canvas.sendToBack(this.arrowArc1);
        canvas.sendToBack(this.arrowArc2);
    }

    removeFromGroup(group: fabric.Group): void {
        group.remove(this, this.arrowArc1, this.arrowArc2, this.weightText)
        this.updateLinePoints()
        this.updateText()
    }

    remove(canvas: fabric.Canvas): void {
        const in_index = this.from.arcs.arcs_out.indexOf(this)
        if (in_index >= 0) {
            this.from.arcs.arcs_out.splice(in_index, 1)
        }
        const out_index = this.to.arcs.arcs_in.indexOf(this)
        if (out_index >= 0) {
            this.to.arcs.arcs_in.splice(out_index, 1)
        }
        canvas.remove(this, this.arrowArc1, this.arrowArc2, this.weightText)
    }

    private updateTextPosition(start: Point, end: Point) {
        const x = start.x + (end.x - start.x) / 2
        const y = start.y + (end.y - start.y) / 2
        this.weightText.set({top: y, left: x})
    }

    updateLinePoints() {
        const fromGroup = this.from.group
        const toGroup = this.to.group
        let lineStart
        if (fromGroup) {
            // from is in group and arc is not
            lineStart = {x: this.from.left! + fromGroup.left! + (fromGroup.width! / 2), y: this.from.top! + fromGroup.top! + (fromGroup.height! / 2)}
        } else {
            // no group
            lineStart = {x: this.from.left!, y: this.from.top!}
        }

        let target: Point
        if (toGroup) {
            // from is in group and arc is not
            target = {x: this.to.left! + toGroup.left! + (toGroup.width! / 2), y: this.to.top! + toGroup.top! + (toGroup.height! / 2)}
        } else {
            target = {x: this.to.left!, y: this.to.top!}
        }

        const lineEnd: Point = this.shortenLine(lineStart, target, 30, this.to)
        const [a1, a2] = this.calculateArrowhead(lineStart, lineEnd, 25)
        this.updateTextPosition(lineStart, lineEnd)
        // @ts-ignore: this works.
        this.set({x1: lineStart.x, y1: lineStart.y, x2: lineEnd.x, y2: lineEnd.y})
        this.arrowArc1.set({x1: lineEnd.x, y1: lineEnd.y, x2: a1.x, y2: a1.y})
        this.arrowArc2.set({x1: lineEnd.x, y1: lineEnd.y, x2: a2.x, y2: a2.y})
        this.arrowArc1.setCoords()
        this.arrowArc2.setCoords()
        this.setCoords()
    }

    private shortenLine(from: Point, to: Point, lengthToShorten: number, toElem: Place | Transition): Point {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        if (toElem instanceof Place) {
            lengthToShorten = toElem.radius!
        } else {
            lengthToShorten = this.getLineLengthIntoTransition(from, to, toElem)
        }

        // If line is too short, return p1 as the endpoint
        if (lineLength <= lengthToShorten) {
            return { x: from.x, y: from.y };
        }

        // Shorten the line by the specified length
        const shortenedLength = lineLength - lengthToShorten;
        const shortenedX = from.x + (dx / lineLength) * shortenedLength;
        const shortenedY = from.y + (dy / lineLength) * shortenedLength;

        return { x: shortenedX, y: shortenedY };
    }

    private getLineLengthIntoTransition(from: Point, to: Point, transition: Transition): number {
        // Calculate the vector components of the line
        const dx = from.x - to.x;
        const dy = from.y - to.y;

        const angleRadians = Math.atan2(dx, dy)
        const angleDegrees = (angleRadians * 180) / Math.PI;
        const clippedAngle = Math.abs(Math.abs(angleDegrees) - 90);
        const clippedAngleRadians = clippedAngle * Math.PI / 180

        // Calculate the length of the line segment within the rectangle
        if (clippedAngle < 50 * (transition.height! / transition.width!)) {
            return ((transition.width! / 2) / Math.cos(clippedAngleRadians))
        } else {
            return ((transition.height! / 2) / Math.sin(clippedAngleRadians))
        }
    }

    private calculateArrowhead(start: Point, end: Point, arrowLength: number = 10, arrowAngle: number = 20): [Point, Point] {
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

    increment() {
        this.weight++;
        this.updateText();
    }

    decrement() {
        if (this.weight > 1) {
            this.weight--;
        }
        this.updateText();
    }

    setAmount(amount: number): void {
        this.weight = amount;
        if (this.weight <= 1) { this.weight = 1}
        this.updateText()
    }

    private updateText() {
        this.weightText.set({text: String(this.weight)});
    }

    updateTextFromString(text: string) {
        this.weight = +text.replaceAll(/\D/g, '')
        this.updateText()
    }
}

/**
 * Model class for any kind of Text. Knows its parent.
 * @class
 */
export class Text extends fabric.IText {
    parent: Arc | Place;

    constructor(text: string, parent: Arc | Place) {
        super(text, textOptions);
        this.parent = parent;
    }

    updateFromText() {
        this.parent.updateTextFromString(this.text ? this.text : "");
    }
}
