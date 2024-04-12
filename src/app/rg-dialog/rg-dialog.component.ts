import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

/**
 * A dialog to display when a reachability graph could be opened. Asks the user for confirmation and whether to replace
 * a potentially existing reachability graph with the new one.
 */
@Component({
  selector: 'app-rg-dialog',
  templateUrl: './rg-dialog.component.html',
  styleUrls: ['./rg-dialog.component.scss']
})
export class RgDialogComponent {
    replaceExisting: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<RgDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    onClick(confirmed: boolean) {
        this.dialogRef.close({ confirmed: confirmed, replaceExisting: this.replaceExisting });
    }
}
