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
    this.ref.disableClose = true;
  }

  cancelHelp = async (): Promise<boolean> => {
    this.command.buttonPress("cancel help request");

    return new Promise<boolean>((resolve, reject) => {
      this.api.help("cancel").subscribe(
        data => {
          resolve(true);
        },
        err => {
          console.error("failed to cancel help:", err);
          resolve(false);
        }
      );
    });
  };

  confirmHelp = async (): Promise<boolean> => {
    this.command.buttonPress("confirm help request");

    return new Promise<boolean>((resolve, reject) => {
      this.api.help("confirm").subscribe(
        data => {
          resolve(true);
        },
        err => {
          console.error("failed to cancel help:", err);
          resolve(false);
        }
      );
    });
  };
}
