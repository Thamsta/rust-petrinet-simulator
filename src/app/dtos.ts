import {Arc, Place, Transition} from "./elements";

class Position {
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

	constructor(transition: Transition) {
		this.id = transition.id
		this.position = new Position(transition.left!, transition.top!)
	}
}

export class PlaceDTO {
	id: string
	position: Position
	initialMarking: number

	constructor(place: Place) {
		this.id = place.id
		this.position = new Position(place.left!, place.top!)
		this.initialMarking = place.tokens
	}

}

export class ArcDTO {
	id: string
	source: string
	target: string
	text: string

	constructor(arc: Arc) {
		this.id = arc.id
		this.source = arc.from.id
		this.target = arc.to.id
		this.text = String(arc.weight)
	}
}
