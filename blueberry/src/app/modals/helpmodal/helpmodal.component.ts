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
    this.ref.backdropClick().subscribe(() => {
      this.cancel();
    });
  }

  public cancel() {
    this.command.buttonPress("exit help modal");
    this.ref.close();
  }

  public requestHelp() {
    this.command.buttonPress("request help");

    this.api.help("help").subscribe(
      data => {
        this.dialog.open(ConfirmHelpModal, {
          width: "80vw"
        });

        this.ref.close();
      },
      err => {
        console.error("failed to request help", err);
      }
    );
  }
}
