import {CanvasComponent} from "../canvas.component";
import {NetDTO} from "../../dtos";
import {Place, Transition} from "../../elements";

export class ImportService {
    private canvas: CanvasComponent;

    constructor(canvas: CanvasComponent) {
        this.canvas = canvas;
    }

    loadNet(net: NetDTO, loadDirty: boolean): void {
        let map = new Map<string, Transition | Place>()
        net.places.forEach(place => {
            let p = this.canvas.addPlace(place.position.x, place.position.y)
            p.setAmount(place.initialMarking)
            p.id = place.id
            p.setInfoText(place.infoText)
            map.set(p.id, p)
        })
        net.transitions.forEach(transition => {
            let t = this.canvas.addTransition(transition.position.x, transition.position.y)
            t.id = transition.id
            t.setInfoText(transition.infoText)
            map.set(t.id, t)
        })
        net.arcs.forEach(arc => {
            let from = map.get(arc.source)
            let to = map.get(arc.target)

            let a = this.canvas.addArc(from, to)
            if (a == undefined) return;

            a.weight = +arc.text
            a.id = arc.id
            a.setInfoText(arc.infoText)
        })
    }
}