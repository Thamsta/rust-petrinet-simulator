import {Component, Input} from '@angular/core';
import {open} from '@tauri-apps/api/dialog';
import {readTextFile} from '@tauri-apps/api/fs';
import {NetDTO} from "../dtos";
import {NetCanvas} from "../canvas/canvas.component";

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
				extensions: ['pnon']
			}]
		});
		if (selected == null || Array.isArray(selected)) return

		let fileContent = await readTextFile(selected);
		let net = JSON.parse(fileContent);
		if (net ! instanceof NetDTO) {
			console.log("net could not be parsed")
			return
		}

		this.canvas.loadNet(net as NetDTO)
	}
}
