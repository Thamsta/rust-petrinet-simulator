import {Place, Transition} from "../../elements";

export class ElementCache {
    places: Place[] = []
    transitions: Transition[] = []

    isActive: boolean = false // the cache can only be active when the canvas is locked.

    flush() {
        this.places = []
        this.transitions = []
        this.isActive = false
    }

    cache(places: Place[], transitions: Transition[]) {
        this.places = places
        this.transitions = transitions
        this.isActive = true
    }

    getElements(): [Place[], Transition[]] {
        if (!this.isActive) {
            console.warn("Accessing inactive element cache!")
        }
        return [this.places, this.transitions]
    }
}