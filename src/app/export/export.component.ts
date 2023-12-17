import {Component} from '@angular/core';
import {save} from "@tauri-apps/api/dialog";
import {writeTextFile} from "@tauri-apps/api/fs";

@Component({
    selector: 'app-export',
    templateUrl: './export.component.html',
    styleUrls: ['./export.component.scss']
})
export class ExportComponent {
    async downloadCustomFile() {
        const filePath = await save({
            title: "Save Net",
            filters: [{name: "", extensions: ["xml", "json"]}],
        });
        if (filePath == null) return;

        await writeTextFile(filePath, "content");
    };
}
