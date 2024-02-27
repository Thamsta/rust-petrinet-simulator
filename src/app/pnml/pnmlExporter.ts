import {NetCanvas} from "../canvas/canvas.component";
import {Arc, Place, Transition} from "../elements";
import {ArcDTO, NetDTO, PlaceDTO, TransitionDTO} from "../dtos";
import {v4 as uuidv4} from "uuid";
import {
  Pnml,
  PnmlArc,
  PnmlGraphics,
  PnmlInitialMarking,
  PnmlInscription,
  PnmlLine,
  PnmlNet,
  PnmlOffset,
  PnmlPlace,
  PnmlPosition,
  PnmlToolspecific,
  PnmlTransition
} from "./types";
import * as xml2js from "xml2js";

export class PnmlExporter {

  private uuidToIdMap: Map<string, string>
  private elementCounter: number

  constructor() {
    this.uuidToIdMap = new Map<string, string>()
    this.elementCounter = 0
  }

  public createXml(net: NetDTO): string {
    const pnml = this.pnmlFromNetDto(net)
    return this.parsePnml(pnml)
  }

  private pnmlFromNetDto(net: NetDTO): Pnml {
    let $ = {xmlns: "http://www.pnml.org/version-2009/grammar/pnml"}
    let nets: PnmlNet[] = [this.netFromNetDTO(net)]
    return new Pnml($, nets)
  }

  private netFromNetDTO(net: NetDTO): PnmlNet {
    let $ = {id: `net_${net.id}`, type: "RefNet"}
    let names = [{text: [net.name]}]
    let places: PnmlPlace[] = this.transformPlaces(net.places, net.id)
    let transitions: PnmlTransition[] = this.transformTransitions(net.transitions, net.id)
    let arcs: PnmlArc[] = this.transformArcs(net.arcs, net.id)
    return new PnmlNet($, names, places, transitions, arcs);
  }

  private parsePnml(pnml: Pnml) {
    const builder = new xml2js.Builder({
      rootName: "pnml",
      xmldec: {version: "1.0", encoding: "UTF-8", standalone: false},
    });
    return builder.buildObject(this.removeNullOrUndefined(pnml));
  }

  private transformPlaces(places: PlaceDTO[], netUUID: string): PnmlPlace[] {
    return places.map(place => this.createPlace(place, netUUID))
  }

  private createPlace(place: PlaceDTO, netUUID: string): PnmlPlace {
    let $ = {id: `p${++this.elementCounter}_${netUUID}`}
    this.uuidToIdMap.set(place.id, $.id)
    let position = [new PnmlPosition({
      x: place.position.x.toString(),
      y: place.position.y.toString()
    })]
    let graphics: PnmlGraphics[] = [new PnmlGraphics(position)]
    let toolSpecificAttributes = {tool: "renew", version: "4.0", uuid: place.id}
    let toolSpecific: PnmlToolspecific[] = [new PnmlToolspecific(toolSpecificAttributes)]
    let initialMarking: PnmlInitialMarking[] = this.createInitialMarking(place)
    return new PnmlPlace($, graphics, toolSpecific, initialMarking)
  }

  private createInitialMarking(place: PlaceDTO): PnmlInitialMarking[] {
    let offset = [new PnmlOffset({x: "0", y: "0"})]
    let graphics: PnmlGraphics[] = [new PnmlGraphics(offset)]
    let text: string[] = [place.initialMarking.toString()]
    return [new PnmlInitialMarking(graphics, text)]
  }

  private transformTransitions(transitions: TransitionDTO[], netUUID: string): PnmlTransition[] {
    return transitions.map(transition => this.createTransition(transition, netUUID))
  }

  private createTransition(transition: TransitionDTO, netUUID: string): PnmlTransition {
    let $ = {id: `t${++this.elementCounter}_${netUUID}`}
    this.uuidToIdMap.set(transition.id, $.id)
    let position = [new PnmlPosition({
      x: transition.position.x.toString(),
      y: transition.position.y.toString()
    })]
    let graphics = [new PnmlGraphics(position)]
    let toolSpecificAttributes = {tool: "renew", version: "4.0", uuid: transition.id}
    let toolSpecific: PnmlToolspecific[] = [new PnmlToolspecific(toolSpecificAttributes)]
    return new PnmlTransition($, graphics, toolSpecific);
  }

  private transformArcs(arcs: ArcDTO[], netUUID: string): PnmlArc[] {
    return arcs.map(arc => this.createArc(arc, netUUID))
  }

  private createArc(arc: ArcDTO, netUUID: string): PnmlArc {
    let $ = {
      id: `a${++this.elementCounter}_${netUUID}`,
      source: this.uuidToIdMap.get(arc.source) ?? "",
      target: this.uuidToIdMap.get(arc.target) ?? ""
    }
    let line: PnmlLine = new PnmlLine({color: "rgb(0,0,0)", style: "solid"})
    let graphics = [new PnmlGraphics(undefined, undefined, undefined, [line])]
    let inscription = [new PnmlInscription(graphics, [arc.text])]
    let toolSpecificAttributes = {tool: "renew", version: "4.0", uuid: arc.id}
    let toolSpecific: PnmlToolspecific[] = [new PnmlToolspecific(toolSpecificAttributes)]
    return new PnmlArc($, graphics, inscription, toolSpecific);
  }


  private removeNullOrUndefined(obj: any): any {
    const jsonString = JSON.stringify(obj, (key, value) => (value === undefined || value === null) ? undefined : value);
    let parsed = JSON.parse(jsonString);
    console.log(parsed)
    return parsed
  }
}
