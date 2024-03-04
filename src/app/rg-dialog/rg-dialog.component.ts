import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-rg-dialog',
  templateUrl: './rg-dialog.component.html',
  styleUrls: ['./rg-dialog.component.scss']
})
export class RgDialogComponent {
    checkboxChecked: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<RgDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    onClick(confirmed: boolean) {
        this.dialogRef.close({ confirmed: confirmed, checkboxChecked: this.checkboxChecked });
    }
}
