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
    selector: 'app-load-duplicate-dialog',
    templateUrl: './load-duplicate-dialog.component.html',
    styleUrls: ['./load-duplicate-dialog.component.scss']
})
export class LoadDuplicateDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<LoadDuplicateDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
    }

    onClick(strategy: DuplicateNetStrategies) {
        this.dialogRef.close({strategy: strategy});
    }

    protected readonly DuplicateNetStrategies = DuplicateNetStrategies;
}
