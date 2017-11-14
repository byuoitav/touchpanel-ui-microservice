import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'help',
    template: `
        <h1 mat-dialog-title class="center">Input Changed<h1>
        
        <div mat-dialog-content class="content">
            <span>Display {{data.number}} {{data.message}}</span>
        </div>
        
        <div mat-dialog-actions class="buttons">
            <button mat-raised-button color="primary" matDialogClose>Ok</button>
        </div>
    `,
    styles: [`
        .center {
            text-align: center; 
        }

        .content {
            overflow: hidden; 
            font-size: 3vh;
            text-align: center;
        }

        .buttons {
            display: flex;
            justify-content: center;
            align-items: center;
        }
    `],
})

export class ChangedDialog {

    constructor(public dialogRef: MatDialogRef<ChangedDialog>, @Inject(MAT_DIALOG_DATA) public data: any) {}

    private cancel() {
        this.dialogRef.close(); 
    }
}
