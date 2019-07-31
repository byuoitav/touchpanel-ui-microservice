import { Component, OnInit, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";

@Component({
  selector: "error-dialog",
  templateUrl: "./error.component.html",
  styleUrls: ["./error.component.scss"]
})
export class ErrorDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      headerMessage: string;
      bodyMessage: string;
      errorMessage: string;
    },
    public dialogRef: MatDialogRef<ErrorDialogComponent>
  ) { }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }
}
