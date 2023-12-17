import {Component, Input} from '@angular/core';
import {save} from "@tauri-apps/api/dialog";
import {writeTextFile} from "@tauri-apps/api/fs";

@Component({
    selector: 'app-export',
    templateUrl: './export.component.html',
    styleUrls: ['./export.component.scss']
})
export class ExportComponent {

    @Input() getNet: (() => any) | undefined;

    async downloadCustomFile() {
        if (this.getNet) {
            this.getNet()
        }
        const filePath = await save({
            title: "Save Net",
            filters: [{name: "", extensions: ["xml", "json"]}],
        });
        if (filePath == null) return;

        await writeTextFile(filePath, "content");
    };
}
