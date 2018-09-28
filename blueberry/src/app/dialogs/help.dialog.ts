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
            <button mat-raised-button color="primary" tabindex="2" *ngIf="!isAfterHours()">Request Help</button>
        </div>
    `,
    styleUrls: ['../colorscheme.scss', './help.dialog.scss'],
})

export class HelpDialog {

    constructor(public dialogRef: MatDialogRef<HelpDialog>, @Inject(MAT_DIALOG_DATA) public data: any) {}

    cancel() {
        this.dialogRef.close(); 
    }

    isAfterHours(): boolean {
        let date = new Date();
        let DayOfTheWeek = date.getDay();
        let CurrentHour = date.getHours();
    
        switch(DayOfTheWeek) {
          // Sunday
          case 0: { return true; }
          // Monday
          case 1: {
            if(CurrentHour < 7 || CurrentHour >= 19) { return true; }
            else { return false; }
          }
          // Tuesday
          case 2: {
            if(CurrentHour < 7 || CurrentHour >= 21) { return true; }
            else { return false; }
          }
          // Wednesday
          case 3: {
            if(CurrentHour < 7 || CurrentHour >= 21) { return true; }
            else { return false; }
          }
          // Thursday
          case 4: {
            if(CurrentHour < 7 || CurrentHour >= 21) { return true; }
            else { return false; }
          }
          // Friday
          case 5: {
            if(CurrentHour < 7 || CurrentHour >= 20) { return true; }
            else { return false; }
          }
          // Saturday
          case 6: {
            if(CurrentHour < 8 || CurrentHour >= 12) { return true; }
            else { return false; }
          }
          default: { return false; }
        }
      }
}
