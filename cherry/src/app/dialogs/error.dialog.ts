import { Component, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";


@Component({
  selector: "error-dialog",
  template: `
  <div mat-dialog-content>
        <span class="mat-h3">{{data}}</span>
        </div>

        <div mat-dialog-actions>
        <button color="warn" (click)="close()" (press)="close()" mat-flat-button>
        Cancel
        </button>

        <button color="accent" mat-flat-button (click)="confirmed()" cdkFocusInitial>
        Confirm
        </button>
    </div>`,
  styles: [
    `
    .mat-dialog-title {
        text-align: center;
    }
    
    .mat-dialog-content {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        .space {
            height: 3vh;
        }
    }
    
    .mat-dialog-actions {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
    }
    
    .form-field {
        width: 35vw;
    }
    `
  ]
})
export class ErrorDialog {
  constructor(
    public dialogRef: MatDialogRef<ErrorDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close = () => {
    this.dialogRef.close();
  };

  confirmed = () => {
    this.dialogRef.close("confirmed");
  }
}
