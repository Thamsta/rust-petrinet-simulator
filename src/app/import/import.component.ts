import {Component, Input} from '@angular/core';
import {open} from '@tauri-apps/api/dialog';
import {readTextFile} from '@tauri-apps/api/fs';
import {NetDTO} from "../dtos";
import {NetCanvas} from "../canvas/canvas.component";
import {PnmlImporterService} from "../pnml/pnml-importer.service";

@Component({
    selector: 'app-import',
    templateUrl: './import.component.html',
    styleUrls: ['./import.component.scss']
})
export class ImportComponent {

    @Input() canvas: NetCanvas | undefined; // for exporting the net

    async loadFile() {
        if (this.canvas == null) return

        const selected = await open({
            multiple: false,
            filters: [{
                name: 'Net',
                extensions: ['pnon', 'pnml']
            }]
        });
        if (selected == null || Array.isArray(selected)) return

        const fileEnding = selected.substring(selected.lastIndexOf('.') + 1)

        let fileContent = await readTextFile(selected);
        let net

        switch (fileEnding) {
            case "pnon": net = JSON.parse(fileContent); break
            case "pnml": net = await this.loadPnml(fileContent, selected); break
        }

        if (!net) {
            // this case should be prevented by the OS file dialogue
            console.log(`Could not load net from file ${selected}. File ending might be unsupported.`)
            return
        }
        this.canvas.loadNet(net as NetDTO)
    }

    private async loadPnml(fileContent: string, selected: string) {
        let nets = await new PnmlImporterService().parseXml(fileContent)
        if (nets.length > 1) {
            console.log(`PNML file '${selected}' contains more than one net. Only the first one is loaded.`)
        }
        return nets[0]
    }
}
