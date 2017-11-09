import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { Output } from '../objects/status.objects';

@Component({
    selector: 'sharescreen',
    template: `
        <h1 mat-dialog-title class="center">Share Screen<h1>
        
        <div mat-dialog-content class="content">
            <mat-grid-list cols="3">
                <mat-grid-tile *ngFor="let d of data.displays" [colspan]="1" [rowspan]="1">
                    <button mat-fab class="selection" [class.selected]="outputs.includes(d)" (click)="toggle(d)">{{d.name}}</button>
                </mat-grid-tile>
            </mat-grid-list>
        </div>
        
        <div mat-dialog-actions class="buttons">
            <button mat-raised-button color="warn" (click)="cancel()" tabindex="-1">Cancel</button>
            <button mat-raised-button color="primary" [matDialogClose]="outputs" tabindex="2">Share</button>
        </div>
    `,
    styleUrls: ['../colorscheme.scss', './sharescreen.dialog.scss'],
})

export class ShareScreenDialog {

    private outputs: Output[] = [];

    constructor(public dialogRef: MatDialogRef<ShareScreenDialog>, @Inject(MAT_DIALOG_DATA) public data: any) {}

    private toggle(output: Output) {
        if (!this.outputs.includes(output)) {
            this.outputs.push(output);
        } else {
            this.outputs.splice(this.outputs.indexOf(output), 1); 
        }
    }

    private cancel() {
        this.dialogRef.close(); 
    }
}
