import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { CommandService } from "../../services/command.service";
import { AudioDevice } from "../../objects/status.objects";

@Component({
  selector: "audiomodal",
  templateUrl: "./audiomodal.component.html",
  styleUrls: ["./audiomodal.component.scss"]
})
export class AudioModalComponent implements OnInit {
  constructor(
    public ref: MatDialogRef<AudioModalComponent>,
    private command: CommandService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public data: { devices: AudioDevice[]; master: AudioDevice }
  ) {}

  ngOnInit() {
    console.log("devices", this.data.devices);
  }

  done = () => {
    this.command.buttonPress("close audio modal");
    this.ref.close();
  };
}
