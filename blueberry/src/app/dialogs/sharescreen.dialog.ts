import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'sharescreen',
    templateUrl: 'sharescreen.dialog.html',
    styleUrls: ['sharescreen.dialog.scss']
})

export class ShareScreenDialog {
    constructor(public dialogRef: MatDialogRef<ShareScreenDialog>, @Inject(MAT_DIALOG_DATA) public data: any) {}

    private cancel() {
        this.dialogRef.close(); 
    }
}
