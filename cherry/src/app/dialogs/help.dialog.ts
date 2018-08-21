import { Component, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { APIService } from "../services/api.service";
import { ConfirmHelpDialog } from "./confirmhelp.dialog";

@Component({
  selector: "help",
  template: `
        <h1 mat-dialog-title class="text">Help</h1>

        <div mat-dialog-content class="text">
            <p>
              Please call AV Support at 801-422-7671 for help, or request help by pressing <i>Request Help</i> to send support staff to you.
            </p>
        </div>

        <div mat-dialog-actions class="items secondary-theme">
            <button mat-raised-button
                color="warn"
                (click)="cancel()">Cancel
            </button>
            <button mat-raised-button
                color="primary"
                (click)="requestHelp()">Request Help
                </button>
        </div>
    `,
  styles: [
    `
      .text {
        text-align: center;
        font-family: Roboto, "Helvetica Neue", sans-serif;
      }

      .items {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
      }
    `
  ]
})
export class HelpDialog {
  constructor(
    public dialogRef: MatDialogRef<HelpDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public api: APIService
  ) {}

  public requestHelp() {
    this.api.help("help").subscribe(success => {
      if (success) {
        const dialogRef = this.dialog.open(ConfirmHelpDialog, {
          width: "70vw"
        });

        this.dialogRef.close();
      } else {
        console.error("failed to request help");
      }
    });
  }

  public cancel() {
    this.dialogRef.close();
  }
}
