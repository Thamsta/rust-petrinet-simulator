import {Arc, NetElement, Place, Transition} from "../../elements";
import {NetDTO} from "../../dtos";
import {IEvent} from "fabric/fabric-impl";

export interface NetCanvas {
    name: string
    id: string
    getAllElements(): NetElement[]

    getTransitions(): Transition[]
    getPlaces(): Place[]
    getArcs(): Arc[]

    /**
     * Wipes the canvas and loads the given net
     * @param net The net to be loaded
     * @param loadDirty Whether the net should immediately be considered dirty
     */
    loadNet(net: NetDTO, loadDirty: boolean): void
    onSavedNet(name: string): void
}

export type CanvasEvent = {
    type: string
    source: IEvent<MouseEvent>
}

export type NetRenameEvent = {
    name: string
    dirty: boolean
}