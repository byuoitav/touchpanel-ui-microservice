import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { CommandService } from "../../services/command.service";
import { AudioDevice } from "../../objects/status.objects";
import { Preset } from "../../objects/objects";

@Component({
  selector: "audiomodal",
  templateUrl: "./audiomodal.component.html",
  styleUrls: ["./audiomodal.component.scss"]
})
export class AudioModalComponent implements OnInit {
  devices: AudioDevice[] = [];

  constructor(
    public ref: MatDialogRef<AudioModalComponent>,
    private command: CommandService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public preset: Preset
  ) {
    for (const a of preset.audioDevices) {
      this.devices.push(a);
    }
    for (const a of preset.audioDevices) {
      this.devices.push(a);
    }
    for (const a of preset.audioDevices) {
      this.devices.push(a);
    }
    for (const a of preset.audioDevices) {
      this.devices.push(a);
    }
    for (const a of preset.audioDevices) {
      this.devices.push(a);
    }
  }

  ngOnInit() {
    console.log("preset", this.preset);
  }

  done = () => {
    this.command.buttonPress("close audio modal");
    this.ref.close();
  };
}
