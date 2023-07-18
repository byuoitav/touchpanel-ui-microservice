import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "messagemodal",
  templateUrl: "./messagemodal.component.html",
  styleUrls: ["./messagemodal.component.scss"]
})
export class MessageModalComponent implements OnInit {
  constructor(
    public ref: MatDialogRef<MessageModalComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      message: string;
      showSpinner: boolean;
      closeText: string;
    }
  ) {}

  ngOnInit() {
    this.ref.disableClose = true;
  }

  public close() {
    this.ref.close();
  }
}
