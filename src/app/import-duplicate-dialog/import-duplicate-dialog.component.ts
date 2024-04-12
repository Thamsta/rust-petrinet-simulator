import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

export enum DuplicateNetStrategies {
    CANCEL,
    REPLACE,
    NEW,
}

/**
 * A dialog to display when a net that is already opened is opened again. Provides different handling strategies.
 */
@Component({
    selector: 'app-import-duplicate-dialog',
    templateUrl: './import-duplicate-dialog.component.html',
    styleUrls: ['./import-duplicate-dialog.component.scss']
})
export class ImportDuplicateDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ImportDuplicateDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
    }

    onClick(strategy: DuplicateNetStrategies) {
        this.dialogRef.close({strategy: strategy});
    }

    protected readonly DuplicateNetStrategies = DuplicateNetStrategies;
}
