import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";


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

    // TODO: update the return to use the new subscribe convention from rxjs
    return new Promise<boolean>((resolve, reject) => {
      this.api.help("help").subscribe({
        next: data => {
          console.log("help requested", data);
          resolve(true);
        },
        error: err => {
          console.error("failed to request help", err);
          resolve(false);
        },
        complete: () => {
          console.log("help request completed");
        }
      });
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
