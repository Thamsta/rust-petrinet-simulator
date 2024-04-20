import {Arc, Place, Transition} from "./elements";

export class Position {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class NetDTO {
    id: string
    type: string
    name: string
    places: PlaceDTO[]
    transitions: TransitionDTO[]
    arcs: ArcDTO[]

    constructor(id: string, type: string, name: string, places: PlaceDTO[], transitions: TransitionDTO[], arcs: ArcDTO[]) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.places = places;
        this.transitions = transitions;
        this.arcs = arcs;
    }
}

export class TransitionDTO {
    id: string
    position: Position
    infoText: string
    color: string

    static fromTransition(transition: Transition) {
        let id = transition.id
        let position = getAbsolutePosition(transition)
        let infoText = transition.infoText.text ?? ""
        let color = transition.color
        return new this(id, position, infoText, color);
    }

    constructor(id: string, position: Position, infoText: string, color: string) {
        this.id = id;
        this.position = position;
        this.infoText = infoText;
        this.color = color
    }
}

export class PlaceDTO {
    id: string
    position: Position
    initialMarking: number
    infoText: string
    color: string

    static fromPlace(place: Place) {
        let id = place.id
        let position = getAbsolutePosition(place)
        let initialMarking = place.tokens
        let infoText = place.infoText.text ?? ""
        let color = place.fill as string
        return new this(id, position, initialMarking, infoText, color);
    }

    constructor(id: string, position: Position, initialMarking: number, infoText: string, color: string) {
        this.id = id;
        this.position = position;
        this.initialMarking = initialMarking;
        this.infoText = infoText;
        this.color = color;
    }
}

export class ArcDTO {
    id: string
    source: string
    target: string
    text: string
    infoText: string

    static fromArc(arc: Arc) {
        let id = arc.id
        let source = arc.from.id
        let target = arc.to.id
        let text = String(arc.weight)
        let infoText = arc.infoText.text ?? ""
        return new this(id, source, target, text, infoText)
    }

    constructor(id: string, source: string, target: string, text: string, infoText: string) {
        this.id = id
        this.source = source
        this.target = target
        this.text = text
        this.infoText = infoText
    }
}

export function getAbsolutePosition(obj: Place | Transition) {
    let group = obj.group;
    if (group == undefined) {
        return new Position(obj.left!, obj.top!)
    }

    // consider relative position to the group center. A 0.5 constant is added by fabricJS..
    const xOffset = group.left! + (group.width! / 2) - 0.5
    const yOffset = group.top! + (group.height! / 2) - 0.5
    return new Position(xOffset + obj.left!, yOffset + obj.top!)
}
