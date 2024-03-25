import {fabric} from "fabric";
import {v4 as uuidv4} from "uuid";
import {fill_color, line_color} from "./colors";
import {Canvas} from "fabric/fabric-impl";
import {scale} from "./config";

export type NetElement = Place | Transition | Arc

/**
 * Represents an element that can be included in a group selection and
 * has special behaviour that needs to be considered when it is added
 * to a group.
 * @interface
 */
interface Groupable {
    handleGrouping(group: fabric.Group): void
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

interface TextEditable {
    enterEditing(): void
    exitEditing(): void
}

/**
 * Allows the presentation of arbitrary text under the element.
 * Currently experimental.
 */
interface WithInfoText {
    setInfoText(text: string): void
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
	width: 80 * scale,
	height: 50 * scale,
	originX: 'center',
	originY: 'center',
	...baseOptions,
}

// Options for places
const placeOptions = {
	fill: fill_color,
	radius: 30 * scale,
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
    fontSize: 42 * scale,
	...immovableOptions,
	...baseOptions,
    strokeWidth: 0,
}

// Default options for info text.
const infoTextOptions = {
	textAlign: 'center',
    fontSize: 14 * scale,
    fontFamily: 'monospace',
	...immovableOptions,
	...baseOptions,
    strokeWidth: 0,
}

// Default options for name text.
const nameTextOptions = {
	textAlign: 'center',
    fontSize: 14 * scale,
    fontFamily: 'monospace',
	...immovableOptions,
	...baseOptions,
    strokeWidth: 0,
}

/**
 * Represents a Transition
 * @class
 * @implements Removable
 */
export class Transition extends fabric.Rect implements Removable, Groupable, WithInfoText {
    id = uuidv4();

    arcs: Connectable = new Connectable()
    infoText: InfoText
    nameText: NameText

    constructor(x: number, y: number, canvas: fabric.Canvas) {
        super({
            left: x,
            top: y,
            ...transitionOptions,
        });
        this.infoText = new InfoText("", this)
        this.nameText = new NameText("t1", this)
        this.updateTextPosition()
        canvas.add(this.infoText, this.nameText, this)
    }

    setInfoText(text: string): void {
        this.infoText.text = text
        this.updateTextPosition()
    }

    handleGrouping(group: fabric.Group): void {
        group.add(this.infoText)
        this.updateTextPosition()
    }

    remove(canvas: Canvas): void {
        canvas.remove(this, this.infoText, this.nameText)
        this.arcs.remove(canvas)
    }

    updateTextPosition() {
        const infoLength = getLongestLineLength(this.infoText.text)
        const nameLength = getLongestLineLength(this.nameText.text)

        this.infoText.set({
            left: this.left! - (infoLength * 4 * scale),
            top: this.top! + this.height! - (12 * scale),
        })
        this.nameText.set({
            left: this.left! + 0.5 * this.width! + 6 * scale,
            top: this.top! +  0.5 * this.height! - 12 * scale,
        })
    }

    showName(show: boolean) {
        this.nameText.visible = show
    }

    updateTextFromString(_: string) {
        // nothing to do. The text is purely cosmetic
    }
}

/**
 * Represents a Place. Has a number of tokens which can be changed.
 * @class
 * @implements {Removable, Countable, Groupable}
 */
export class Place extends fabric.Circle implements Removable, Countable, Groupable, TextEditable, WithInfoText {
    id = uuidv4();

    tokens= 0
    tokenText: Text
    arcs: Connectable = new Connectable()

    textDx = -11 * scale;
    textDy = -22 * scale;

    infoText: InfoText
    nameText: NameText

    constructor(x: number, y: number, canvas: fabric.Canvas) {
        super({
            left: x,
            top: y,
            ...placeOptions
        })
        this.tokenText = new Text("", this)
        this.infoText = new InfoText("", this)
        this.nameText = new NameText("p1", this)
        this.updateText()
        this.updateTextPosition()
        canvas.add(this.infoText, this.nameText, this.tokenText, this)
        canvas.sendBackwards(this)
        canvas.bringToFront(this.infoText)
        canvas.bringToFront(this.nameText)
        canvas.bringToFront(this.tokenText)
    }

    setInfoText(text: string): void {
        this.infoText.text = text
        this.updateTextPosition()
    }

    enterEditing(): void {
        if (!this.tokenText.isEditing && this.tokens == 0) {
            this.tokenText.enterEditing()
        }
    }

    exitEditing(): void {
        if (this.tokenText.isEditing) {
            this.tokenText.exitEditing()
        }
    }

    handleGrouping(group: fabric.Group): void {
        group.add(this.tokenText)
        this.updateTextPosition() // recalculate text so it uses the relative coordinates of the group
    }

    remove(canvas: fabric.Canvas): void {
        canvas.remove(this, this.tokenText, this.infoText, this.nameText)
        this.arcs.remove(canvas)
    }

    updateTextPosition() {
        const tokenLength = this.tokens.toString().length - 1;
        this.tokenText.set({
            left: this.left! + this.textDx - (tokenLength * 11),
            top: this.top! + this.textDy,
        })

        const infoLength = getLongestLineLength(this.infoText.text)

        this.infoText.set({
            left: this.left! - (infoLength * 4 * scale),
            top: this.top! + this.height! - (12 * scale),
        })
        this.nameText.set({
            left: this.left! + 0.5 * this.width!,
            top: this.top! +  0.5 * this.height! - 12 * scale,
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

    showName(show: boolean) {
        this.nameText.visible = show
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
 * @implements {Removable, Countable, Groupable}
 */
export class Arc extends fabric.Line implements Removable, Countable, Groupable, TextEditable, WithInfoText {
    id = uuidv4();

    from: Place | Transition;
    to: Place | Transition;
    weight = 1
    weightText: Text

    infoText: InfoText

    arrowArc1: fabric.Line;
    arrowArc2: fabric.Line;

    constructor(from: Place | Transition, to: Place | Transition, canvas: fabric.Canvas) {
        super([from.left!, from.top!, to.left!, to.top!], lineOptions);

        this.weightText = new Text(this.weight.toString(), this)
        this.arrowArc1 = new fabric.Line([0,0,0,0], lineOptions) // use any coordinates, will be updated later
        this.arrowArc2 = new fabric.Line([0,0,0,0], lineOptions)

        this.from = from;
        this.to = to;

        this.infoText = new InfoText("", this)

        this.updateLinePoints()
        this.updateText()

        canvas.add(this, this.arrowArc1, this.arrowArc2, this.weightText, this.infoText);
        canvas.sendToBack(this);
        canvas.sendToBack(this.arrowArc1);
        canvas.sendToBack(this.arrowArc2);
    }

    setInfoText(text: string): void {
        this.infoText.text = text
        this.updateLinePoints()
    }

    enterEditing(): void {
        if (!this.weightText.isEditing) {
            this.weightText.enterEditing()
        }
    }

    exitEditing(): void {
        if (this.weightText.isEditing) {
            this.weightText.exitEditing()
        }
    }

    handleGrouping(group: fabric.Group): void {
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
        const y = start.y + (end.y - start.y) / 2 - (45 * scale)
        this.weightText.set({top: y, left: x})

        const infoLength = getLongestLineLength(this.infoText.text)
        this.infoText.set({
            left: this.left! - (infoLength * 5 * scale),
            top: this.top! + (10 * scale),
        })
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
        const [a1, a2] = this.calculateArrowhead(lineStart, lineEnd, 25 * scale)
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
        if (this.weight < 1) this.weight = 1
        this.updateText()
    }

    private updateText() {
        let weightString = this.weight > 1 ? String(this.weight) : ""
        this.weightText.set({text: weightString});
    }

    updateTextFromString(text: string) {
        this.weight = +text.replaceAll(/\D/g, '')
        if (this.weight < 1) this.weight = 1
        this.updateText()
    }
}

/**
 * Model class for any kind of Text. Knows its parent.
 * @class
 */
export class Text extends fabric.IText {
    parent: NetElement;

    constructor(text: string, parent: NetElement) {
        super(text, textOptions);
        this.parent = parent;
    }

    updateFromText() {
        this.parent.updateTextFromString(this.text ? this.text : "");
    }
}

/**
 * Model class for any kind of Text. Knows its parent.
 * @class
 */
export class NameText extends fabric.Text {
    parent: NetElement;

    constructor(text: string, parent: NetElement) {
        super(text, nameTextOptions);
        this.parent = parent;
    }
}

/**
 * Model class for any kind of Text. Knows its parent.
 * @class
 */
export class InfoText extends fabric.Text {
    parent: NetElement;

    constructor(text: string, parent: NetElement) {
        super(text, infoTextOptions);
        this.parent = parent;
    }
}

function getLongestLineLength(text: string | undefined): number {
    if (text == undefined) return 0
    const lines = text.split("\n");
    if (lines.length == 1) return text.length

    return Math.max(...lines.map(line =>line.length))
}
