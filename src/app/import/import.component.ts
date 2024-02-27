import {Component, Input} from '@angular/core';
import {open} from '@tauri-apps/api/dialog';
import {readTextFile} from '@tauri-apps/api/fs';
import {NetDTO} from "../dtos";
import {NetCanvas} from "../canvas/canvas.component";
import {PnmlImporter} from "../pnml/pnmlImporter";

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
            const pnmlImporter = new PnmlImporter()
            let nets = await pnmlImporter.parseXml(fileContent)
            net = nets[0]
        } else {
            net = JSON.parse(fileContent);
        }
		this.canvas.loadNet(net as NetDTO)
	}
}
