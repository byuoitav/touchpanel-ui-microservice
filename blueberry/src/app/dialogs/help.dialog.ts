import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'help',
    template: `
        <h1 mat-dialog-title class="center">Help<h1>
        
        <div mat-dialog-content class="content">
        </div>
        
        <div mat-dialog-actions class="buttons">
            <button mat-raised-button color="warn" (click)="cancel()" tabindex="-1">Cancel</button>
            <button mat-raised-button color="primary" tabindex="2">Request Help</button>
        </div>
    `,
    styleUrls: ['../colorscheme.scss', './sharescreen.dialog.scss'],
})

export class HelpDialog {

    constructor(public dialogRef: MatDialogRef<HelpDialog>, @Inject(MAT_DIALOG_DATA) public data: any) {}

    private cancel() {
        this.dialogRef.close(); 
    }
}
