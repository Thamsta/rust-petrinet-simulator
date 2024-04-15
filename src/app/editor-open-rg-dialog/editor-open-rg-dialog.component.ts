import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
    selector: 'app-editor-open-rg-dialog',
    templateUrl: './editor-open-rg-dialog.component.html',
    styleUrls: ['./editor-open-rg-dialog.component.scss']
})
export class EditorOpenRgDialogComponent {
    replaceExisting: boolean = true;
    isBounded: boolean;

    constructor(
        public dialogRef: MatDialogRef<EditorOpenRgDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.isBounded = data.isBounded
    }

    onClick(confirmed: boolean) {
        this.dialogRef.close({confirmed: confirmed, replaceExisting: this.replaceExisting});
    }
}
