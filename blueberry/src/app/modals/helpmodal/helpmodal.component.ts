import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { APIService } from "../../services/api.service";
import { CommandService } from "../../services/command.service";
import { HelpInfo } from "../../objects/modals";
import { ConfirmHelpModal } from "../confirmhelpmodal/confirmhelpmodal.component";

@Component({
  selector: "helpmodal",
  templateUrl: "./helpmodal.component.html",
  styleUrls: ["./helpmodal.component.scss"]
})
export class HelpModal implements OnInit {
  constructor(
    public ref: MatDialogRef<HelpModal>,
    @Inject(MAT_DIALOG_DATA) public data: HelpInfo,
    public api: APIService,
    public command: CommandService,
    public dialog: MatDialog
  ) {
    console.log("help info:", data);
  }

  ngOnInit() {
    this.ref.disableClose = true;
  }

  public cancel() {
    this.command.buttonPress("exit help modal");
    this.ref.close();
  }

  requestHelp = async (): Promise<boolean> => {
    this.command.buttonPress("request help");

    return new Promise<boolean>((resolve, reject) => {
      this.api.help("help").subscribe(
        data => {
          resolve(true);
        },
        err => {
          console.error("failed to request help", err);
          resolve(false);
        }
      );
    });
  };

  openConfirmHelp = () => {
    this.dialog.open(ConfirmHelpModal, {
      width: "80vw",
      disableClose: true
    });

    this.ref.close();
  };
}
