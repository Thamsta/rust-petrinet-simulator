import {Place, Transition} from "../elements";
import {CanvasComponent} from "../canvas/canvas.component";
import {ArcDTO, PlaceDTO, TransitionDTO} from "../dtos";
import {fabric} from "fabric";

export class ClipboardService {
    private readonly canvas: CanvasComponent;

    private cPlaces: PlaceDTO[] | undefined
    private cTransitions: TransitionDTO[] | undefined
    private cArcs: ArcDTO[] | undefined

    constructor(canvas: CanvasComponent) {
        this.canvas = canvas;
    }

    copy() {
        let {currentTransitions, currentPlaces} = this.getSelectedPlacesAndTransitions();

        this.cPlaces = []
        this.cTransitions = []
        this.cArcs = []

        currentPlaces.forEach(place => {
            this.cPlaces?.push(PlaceDTO.fromPlace(place))
            place.arcs.arcs_out.forEach(arc => {
                if (currentTransitions.includes(arc.to as Transition)) {
                    this.cArcs?.push(ArcDTO.fromArc(arc))
                }
            })
            place.arcs.arcs_in.forEach(arc => {
                if (currentTransitions.includes(arc.from as Transition)) {
                    this.cArcs?.push(ArcDTO.fromArc(arc))
                }
            })
        })
        currentTransitions.forEach(transition => {
            this.cTransitions?.push(TransitionDTO.fromTransition(transition))
        })
        this.moveClipboard()
        console.log("Added to clipboard:", this.cPlaces, this.cTransitions, this.cArcs)
    }

    paste() {
        if (!this.cPlaces || !this.cTransitions || !this.cArcs) {
            return
        }
        this.canvas.canvas.discardActiveObject()

        const addedElements = this.canvas.insertDTOs(this.cPlaces, this.cTransitions, this.cArcs)

        let activeSelection = new fabric.ActiveSelection(addedElements);
        activeSelection.canvas = this.canvas.canvas
        activeSelection.setCoords()

        this.canvas.canvas.setActiveObject(activeSelection)
        this.canvas.renderAll()

        this.moveClipboard()
    }

    private moveClipboard() {
        this.cPlaces?.forEach(place => {
            place.position.x += 15
            place.position.y += 15
        })
        this.cTransitions?.forEach(transition => {
            transition.position.x += 15
            transition.position.y += 15
        })
    }

    private getSelectedPlacesAndTransitions() {
        let currentSelection = this.canvas.getCurrentSelected();

        let currentTransitions = currentSelection
            .filter(obj => obj instanceof Transition)
            .map(obj => obj as Transition)

        let currentPlaces = currentSelection
            .filter(obj => obj instanceof Place)
            .map(obj => obj as Place)

        return {currentTransitions, currentPlaces};
    }
}
