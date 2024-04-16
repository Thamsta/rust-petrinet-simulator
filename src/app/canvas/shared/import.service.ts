import {CanvasComponent} from "../canvas.component";
import {ArcDTO, NetDTO, PlaceDTO, TransitionDTO} from "../../dtos";
import {Arc, Place, Transition} from "../../elements";

export class ImportService {
    private canvas: CanvasComponent;

    constructor(canvas: CanvasComponent) {
        this.canvas = canvas;
    }

    loadNet(net: NetDTO): void {
        this.loadElements(net.places, net.transitions, net.arcs, true)
    }

    loadElements(places: PlaceDTO[], transitions: TransitionDTO[], arcs: ArcDTO[], keepIds: boolean): (Place|Transition|Arc)[] {
        let map = new Map<string, Transition | Place>()
        let loadedElements: (Place|Transition|Arc)[] = []

        places.forEach(place => {
            let p = this.canvas.addPlace(place.position.x, place.position.y)
            p.setAmount(place.initialMarking)
            p.setInfoText(place.infoText)
            if (keepIds) p.id = place.id
            map.set(place.id, p)
            loadedElements.push(p)
        })

        transitions.forEach(transition => {
            let t = this.canvas.addTransition(transition.position.x, transition.position.y)
            if(keepIds) t.id = transition.id
            t.setInfoText(transition.infoText)
            map.set(transition.id, t)
            loadedElements.push(t)
        })

        arcs.forEach(arc => {
            let from = map.get(arc.source)
            let to = map.get(arc.target)

            let a = this.canvas.addArc(from, to)
            if (a == undefined) return;

            a.weight = +arc.text
            if (keepIds) a.id = arc.id
            a.setInfoText(arc.infoText)
            loadedElements.push(a)
        })

        return loadedElements
    }
}