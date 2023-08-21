import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";

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

    //uddate the return to use the new subscribe convention from rxjs
    return new Promise<boolean>((resolve, reject) => {
      this.api.help("cancel").subscribe({
        next: data => {
          console.log("help canceled", data);
          resolve(true);
        },
        error: err => {
          console.error("failed to cancel help:", err);
          resolve(false);
        },
        complete: () => {
          console.log("help cancel completed");
        }
      });
    });

  };

  confirmHelp = async (): Promise<boolean> => {
    this.command.buttonPress("confirm help request");

    //uddate the return to use the new subscribe convention from rxjs

    return new Promise<boolean>((resolve, reject) => {
      this.api.help("confirm").subscribe({
        next: data => {
          console.log("help confirmed", data);
          resolve(true);
        },
        error: err => {
          console.error("failed to cancel help:", err);
          resolve(false);
        },
        complete: () => {
          console.log("help confirm completed");
        }
      });
    });
  };
}
