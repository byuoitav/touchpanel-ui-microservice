import { Component, OnInit, EventEmitter } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { APIService } from "../../services/api.service";
import { CommandService } from "../../services/command.service";
@Component({
  selector: "poweroffallmodal",
  templateUrl: "./poweroffallmodal.component.html",
  styleUrls: ["./poweroffallmodal.component.scss"]
})
export class PowerOffAllModalComponent implements OnInit {
  public PowerEventEmitter: EventEmitter<string>;

  constructor(
    public ref: MatDialogRef<PowerOffAllModalComponent>,
    public api: APIService,
    public command: CommandService,
    public dialog: MatDialog
  ) {
    this.PowerEventEmitter = new EventEmitter();
  }

  ngOnInit() {
    this.ref.disableClose = true; // don't allow them to close it by clicking outside
  }

  public cancel() {
    this.command.buttonPress("cancel power off all");
    this.ref.close();
  }

  public powerOffThisDisplay() {
    this.PowerEventEmitter.emit("thisDisplay");
    this.ref.close();
  }

  public powerOffAllDisplays() {
    this.PowerEventEmitter.emit("allDisplays");
    this.ref.close();
  }
}
