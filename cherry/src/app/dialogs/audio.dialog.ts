import { Component, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: "audio-dialog", 
    template: `
        <div class="dialog-base">
            <audiocontrol [preset]="data.preset" [audioGroups]="data.audioGroups"></audiocontrol>
            <div class="button-wrapper">
                <button mat-raised-button class="close-button" color="warn" (click)="dialogClose()" (press)="dialogClose()">Close</button>
            </div>
        </div>
    `,
    styles: [
        `
            ::ng-deep .cdk-overlay-container {
                z-index: 3000;
            }

            ::ng-deep .mat-dialog-container {
                padding: 0;
                background-color: primary;
            }

            .dialog-base {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .button-wrapper {
                padding: 10px 0 0 10px;
            }

            .close-button {

            }
        `
    ]
})
export class AudioDialog {
    constructor(
        public dialogRef: MatDialogRef<AudioDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialog: MatDialog
    ) {}

    dialogClose() {
        this.dialogRef.close();
    }
}