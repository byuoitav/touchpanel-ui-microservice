import { Component, OnInit, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";

@Component({
  selector: "error-modal",
  templateUrl: "./errormodal.component.html",
  styleUrls: ["./errormodal.component.scss"]
})
export class ErrorModalComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    headerMessage: string;
    bodyMessage: string;
    errorMessage: string;
  },
  public dialogRef: MatDialogRef<ErrorModalComponent>) { }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

}
