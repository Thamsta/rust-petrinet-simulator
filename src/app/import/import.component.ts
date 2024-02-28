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

        let fileContent = await readTextFile(selected);
        let net: NetDTO
        if (selected.endsWith('.pnml')) {
            let nets = await new PnmlImporterService().parseXml(fileContent)
            if (nets.length > 1) {
                console.log(`PNML file '${selected}' contains more than one net. Only the first one is loaded.`)
            }
            net = nets[0]
        } else {
            net = JSON.parse(fileContent);
        }
        this.canvas.loadNet(net as NetDTO)
    }
}
