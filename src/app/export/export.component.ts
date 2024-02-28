import {Component, Input} from '@angular/core';
import {save} from "@tauri-apps/api/dialog";
import {writeTextFile} from "@tauri-apps/api/fs";
import {NetCanvas} from "../canvas/canvas.component";
import {v4 as uuidv4} from "uuid";

import {Arc, Place, Transition} from "../elements";
import {ArcDTO, NetDTO, PlaceDTO, TransitionDTO} from "../dtos";
import {PnmlExporterService} from "../pnml/pnml-exporter.service";

@Component({
    selector: 'app-export',
    templateUrl: './export.component.html',
    styleUrls: ['./export.component.scss']
})
export class ExportComponent {

    @Input() canvas: NetCanvas | undefined; // for exporting the net

    async downloadCustomFile() {
        if (!this.canvas) {
            return
        }

        const netElements = this.canvas.getAllElements()

        const places = netElements.filter(obj => obj instanceof Place)
            .map(t => PlaceDTO.fromPlace(t as Place))
        const transitions = netElements.filter(obj => obj instanceof Transition)
            .map(t => TransitionDTO.fromTransition(t as Transition))
        const arcs = netElements.filter(obj => obj instanceof Arc)
            .map(t => ArcDTO.fromArc(t as Arc))

        const net = new NetDTO(uuidv4(), "pt-net", "net-name", places, transitions, arcs)

        let filePath = await save({
            title: "Save Net",
            filters: [{name: "", extensions: ["pnon", "pnml"]}],
        });
        if (filePath == null) return;
        if (!filePath.includes('.')) filePath += ".pnon"

        const fileEnding = filePath.substring(filePath.lastIndexOf('.') + 1)

        let output
        switch (fileEnding) {
            case 'pnon': output = JSON.stringify(net); break
            case 'pnml': output = new PnmlExporterService().createXml(net); break
        }

        if (!output) {
            // this case should be prevented by the OS file dialogue
            console.log(`Unsupported file type ${fileEnding} in path ${filePath}. Nothing will be written.`)
            return
        }

        await writeTextFile(filePath, output);
    };
}
