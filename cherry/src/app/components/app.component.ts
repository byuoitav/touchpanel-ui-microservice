import { Component, ViewEncapsulation, ViewChild } from "@angular/core";
import { MatTabChangeEvent, MatDialog } from "@angular/material";
import { trigger, style, animate, transition } from "@angular/animations";

import { DataService } from "../services/data.service";
import { CommandService } from "../services/command.service";
import { GraphService } from "../services/graph.service";
import { HelpDialog } from "../dialogs/help.dialog";
import { Output } from "../objects/status.objects";

const HIDDEN = "hidden";
const QUERY = "query";
const LOADING = "indeterminate";
const BUFFER = "buffer";

@Component({
  selector: "cherry",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger("delay", [
      transition(":enter", [animate(500)]),
      transition(":leave", [animate(500)])
    ])
  ]
})
export class AppComponent {
  public loaded: boolean;
  public unlocking = false;
  public progressMode: string = QUERY;

  public selectedTabIndex: number;

  constructor(
    private data: DataService,
    private command: CommandService,
    private dialog: MatDialog
  ) {
    this.loaded = false;
    this.data.loaded.subscribe(() => {
      this.loaded = true;
    });
  }

  public isPoweredOff(): boolean {
    if (!this.loaded) {
      return true;
    }
    return !Output.isPoweredOn(this.data.panel.preset.displays);
  }

  public unlock() {
    this.unlocking = true;
    this.progressMode = QUERY;

    this.command.powerOnDefault(this.data.panel.preset).subscribe(success => {
      if (!success) {
        console.warn("failed to turn on");
      } else {
        // switch direction of loading bar
        this.progressMode = LOADING;

        this.reset();
      }
    });
  }

  public powerOff() {
    this.progressMode = QUERY;

    this.command.powerOff(this.data.panel.preset).subscribe(success => {
      if (!success) {
        console.warn("failed to turn off");
      } else {
        this.reset();
      }
    });
  }

  private reset() {
    // select displays tab
    this.selectedTabIndex = 0;

    // reset mix levels to 100
    this.data.panel.preset.audioDevices.forEach(a => (a.mixlevel = 100));

    // reset masterVolume level
    this.data.panel.preset.masterVolume = 30;

    // stop showing progress bar
    this.unlocking = false;
  }

  public openHelpDialog() {
    const dialogRef = this.dialog.open(HelpDialog, {
      width: "70vw"
    });
  }
}
