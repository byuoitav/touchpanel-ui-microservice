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

  pages: number[] = [];
  curPage: number;

  constructor(
    public ref: MatDialogRef<AudioModalComponent>,
    private command: CommandService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public preset: Preset
  ) {
    for (const a of preset.independentAudioDevices) {
      this.devices.push(a);
    }
    for (const a of preset.independentAudioDevices) {
      this.devices.push(a);
    }
    for (const a of preset.independentAudioDevices) {
      this.devices.push(a);
    }

    const pages = Math.ceil(this.devices.length / 3);
    this.pages = new Array(pages).fill(undefined).map((x, i) => i);

    console.log("devices:", this.devices.length, "pages:", this.pages);
    this.curPage = 0;
  }

  ngOnInit() {
    console.log("preset", this.preset);
  }

  done = () => {
    this.command.buttonPress("close audio modal");
    this.ref.close();
  };

  getDisplayVolume = (): number => {
    return AudioDevice.getVolume(this.preset.audioDevices);
  };

  getDisplayMute = (): boolean => {
    return AudioDevice.getMute(this.preset.audioDevices);
  };

  pageLeft = () => {
    if (this.canPageLeft()) {
      this.curPage--;
    }

    // scroll to the bottom of the page
    const idx = 3 * this.curPage;
    document.querySelector("#device" + idx).scrollIntoView({
      behavior: "smooth"
    });
  };

  pageRight = () => {
    if (this.canPageRight()) {
      this.curPage++;
    }

    // scroll to the top of the page
    const idx = 3 * this.curPage + 2;
    document.querySelector("#device" + idx).scrollIntoView({
      behavior: "smooth"
    });
  };

  canPageLeft = (): boolean => {
    if (this.curPage <= 0) {
      return false;
    }

    return true;
  };

  canPageRight = (): boolean => {
    if (this.curPage + 1 >= this.pages.length) {
      return false;
    }

    return true;
  };
}
