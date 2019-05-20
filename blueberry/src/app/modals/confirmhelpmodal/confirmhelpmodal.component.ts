import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { APIService } from "../../services/api.service";
import { CommandService } from "../../services/command.service";

@Component({
  selector: "confirmhelpmodal",
  templateUrl: "./confirmhelpmodal.component.html",
  styleUrls: ["./confirmhelpmodal.component.scss"]
})
export class ConfirmHelpModal implements OnInit {
  constructor(
    public ref: MatDialogRef<ConfirmHelpModal>,
    public api: APIService,
    public command: CommandService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.ref.disableClose = true; // don't allow them to close it by clicking outside

    // // even though it shouldn't be clickable...
    // this.ref.backdropClick().subscribe(() => {
    //   this.confirmHelp();
    // });
  }

  public cancel() {
    this.command.buttonPress("cancel help request");
    this.api.help("cancel").subscribe(
      data => {
        this.ref.close();
      },
      err => {
        console.error("failed to cancel help:", err);
      }
    );
    this.ref.close();
  }

  public confirmHelp() {
    this.command.buttonPress("confirm help request");

    this.api.help("confirm").subscribe(
      data => {
        this.ref.close();
      },
      err => {
        console.error("failed to confirm help:", err);
      }
    );
  }
}
