import {
    Pnml,
    PnmlArc,
    PnmlGraphics,
    PnmlInitialMarking,
    PnmlInscription,
    PnmlNet,
    PnmlPlace,
    PnmlTransition
} from "./types";
import {ArcDTO, NetDTO, PlaceDTO, Position, TransitionDTO} from "../dtos";
import {Parser} from "xml2js";

export class PnmlImporterService {

    private idToUUIDMap: Map<string, string>
    private baseOffset = 50

    constructor() {
        this.idToUUIDMap = new Map<string, string>()
    }

    public async parseXml(xml: string): Promise<NetDTO[]> {
        let parser: Parser = new Parser({explicitArray: true})
        let parsedStringPromise: Promise<Pnml> = new Promise((resolve, reject) => {
            parser.parseString(xml, (err: any, result: { pnml: Pnml }) => {
                if (err) {
                    reject(err);
                } else {
                    const pnml: Pnml = result.pnml;
                    resolve(pnml);
                }
            });
        });

        return this.createNetDTOFromPNML(parsedStringPromise);
    }

    private async createNetDTOFromPNML(parsedStringPromise: Promise<Pnml>): Promise<NetDTO[]> {
        return parsedStringPromise.then(pnml => {
            let netDTOs: NetDTO[] = [];
            pnml.net.forEach(net => {
                netDTOs.push(this.convertPnmlNet(net));
            })
            return netDTOs;
        })
    }

    private convertPnmlNet(pnmlNet: PnmlNet): NetDTO {
        // net id has format "net_$uuid"
        let id = pnmlNet.$.id.split("_")[1]
        let type = pnmlNet.$.type;
        let name = pnmlNet.name[0].text[0];
        let places = this.createPlaces(pnmlNet.place);
        let transitions = this.createTransitions(pnmlNet.transition);
        let arcs = this.createArcs(pnmlNet.arc);
        return new NetDTO(id, type, name, places, transitions, arcs);
    }

    private createPlaces(pnmlplaces: PnmlPlace[]): PlaceDTO[] {
        return pnmlplaces.map(place => this.createPlace(place))
    }

    private createPlace(pnmlPlace: PnmlPlace): PlaceDTO {
        let uuid = pnmlPlace.toolspecific[0].$.uuid
        let position = this.createPosition(pnmlPlace.graphics[0])
        let initialMarking = this.getMarking(pnmlPlace.initialMarking)
        let inscription = ""
        this.idToUUIDMap.set(pnmlPlace.$.id, uuid)
        return new PlaceDTO(uuid, position, initialMarking, inscription)
    }

    private getMarking(initialMarking: PnmlInitialMarking[] | undefined): number {
        if (!initialMarking) return 0;
        let marking = parseInt(initialMarking[0].text[0])
        if (isNaN(marking)) {
            console.warn("Marking of place was not a number. Set marking to 0")
            return 0
        }
        return marking
    }

    private createTransitions(pnmlTransitions: PnmlTransition[]): TransitionDTO[] {
        return pnmlTransitions.map(transition => this.createTransition(transition))
    }

    private createTransition(pnmlTransition: PnmlTransition): TransitionDTO {
        let uuid = pnmlTransition.toolspecific[0].$.uuid
        let position = this.createPosition(pnmlTransition.graphics[0])
        let inscription = this.getTransitionInscription(pnmlTransition)
        this.idToUUIDMap.set(pnmlTransition.$.id, uuid)
        return new TransitionDTO(uuid, position, inscription)
    }

    private getTransitionInscription(pnmlTransition: PnmlTransition): string {
        // TODO: what if a transition is both up- and downlink?
        if (pnmlTransition.downlink) {
            return pnmlTransition.downlink[0].text[0]
        }
        if (pnmlTransition.uplink) {
            return pnmlTransition.uplink[0].text[0]
        }
        return ""
    }

    private createArcs(pnmlArcs: PnmlArc[]): ArcDTO[] {
        return pnmlArcs.map(arc => this.createArc(arc))
    }

    private createArc(pnmlArc: PnmlArc): ArcDTO {
        let uuid = pnmlArc.toolspecific[0].$.uuid
        let source = this.idToUUIDMap.get(pnmlArc.$.source) ?? ""
        let target = this.idToUUIDMap.get(pnmlArc.$.target) ?? ""
        // TODO: probably should differentiate between number inscriptions and NaN-inscriptions (use infotext for NaN)
        let text = this.getInscriptionText(pnmlArc.inscription)
        let infotext = ""
        return new ArcDTO(uuid, source, target, text, infotext)
    }

    private getInscriptionText(pnmlinscriptions: PnmlInscription[]): string {
        if (!pnmlinscriptions || !pnmlinscriptions[0] || !pnmlinscriptions[0].text) return ""
        return pnmlinscriptions[0].text[0]
    }

    private createPosition(graphics: PnmlGraphics) {
        let x = parseInt(graphics.position![0].$.x) ?? 0
        let y = parseInt(graphics.position![0].$.y) ?? 0
        return new Position(x + this.baseOffset, y + this.baseOffset)
    }
}
