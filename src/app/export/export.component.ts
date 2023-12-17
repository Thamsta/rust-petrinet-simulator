import {Component, Input} from '@angular/core';
import {save} from "@tauri-apps/api/dialog";
import {writeTextFile} from "@tauri-apps/api/fs";
import {NetCanvas} from "../canvas/canvas.component";
import {v4 as uuidv4} from "uuid";

import {Arc, Place, Transition} from "../elements";
import {ArcDTO, NetDTO, PlaceDTO, TransitionDTO} from "../dtos";

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
            .map(t => new PlaceDTO(t as Place))
        const transitions = netElements.filter(obj => obj instanceof Transition)
            .map(t => new TransitionDTO(t as Transition))
        const arcs = netElements.filter(obj => obj instanceof Arc)
            .map(t => new ArcDTO(t as Arc))

        const net = new NetDTO(uuidv4(), "pt-net", "net-name", places, transitions, arcs)

        const filePath = await save({
            title: "Save Net",
            filters: [{name: "", extensions: ["pnon"]}],
        });
        if (filePath == null) return;

        await writeTextFile(filePath, JSON.stringify(net));
    };
}
