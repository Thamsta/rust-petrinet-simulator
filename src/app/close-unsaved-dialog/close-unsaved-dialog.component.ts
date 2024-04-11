import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
    selector: 'app-close-unsaved-dialog',
    templateUrl: './close-unsaved-dialog.component.html',
    styleUrls: ['./close-unsaved-dialog.component.scss']
})
export class CloseUnsavedDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<CloseUnsavedDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
    }

    onClick(close: boolean) {
        this.dialogRef.close({close: close});
    }
}
