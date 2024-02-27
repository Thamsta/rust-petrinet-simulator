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

    static fromTransition(transition: Transition) {
        let id = transition.id
        let position = new Position(transition.left!, transition.top!)
        let infoText = transition.infoText.text ?? ""
        return new this(id, position, infoText);
    }

    constructor(id: string, position: Position, infoText: string) {
        this.id = id;
        this.position = position;
        this.infoText = infoText
    }
}

export class PlaceDTO {
    id: string
    position: Position
    initialMarking: number
    infoText: string

    static fromPlace(place: Place) {
        let id = place.id
        let position = new Position(place.left!, place.top!)
        let initialMarking = place.tokens
        let infoText = place.infoText.text ?? ""
        return new this(id, position, initialMarking, infoText);
    }

    constructor(id: string, position: Position, initialMarking: number, infoText: string) {
        this.id = id;
        this.position = position;
        this.initialMarking = initialMarking;
        this.infoText = infoText;
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
