import { Component, Input as AngularInput } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";

import { DataService } from "../../services/data.service";
import { CommandService } from "../../services/command.service";
import { ViaDialog } from "../../dialogs/via.dialog";

import { Panel } from "../../objects/objects";
import { Display, Input } from "../../objects/status.objects";
import { StreamModalComponent } from "../../dialogs/streammodal/streammodal.component";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "display",
  templateUrl: "./display.component.html",
  styleUrls: ["./display.component.scss"]
})
export class DisplayComponent {
  @AngularInput() panel: Panel;

  selectedDisplays: Set<Display> = new Set();
  inputs: Input[];
  displays: Display[] = [];

  constructor(
    private data: DataService,
    public command: CommandService,
    private dialog: MatDialog
  ) {
    // default to the first display being selected
  }

  ngOnInit() {
    if (this.panel && this.panel.preset) {
      this.panel.preset.displays.forEach(display => {
        if (!display.hidden) {
          this.displays.push(display);
        }
      });
    }

    setTimeout(() => {
      if (this.panel.preset.displays.length > 0) {
        this.selectedDisplays.add(this.displays[0]);
        this.getInputsForDisplay(this.displays[0])
      }
    }, 0);
  }


  public toggleDisplay(d: Display) {
    this.selectedDisplays.clear();
    this.selectedDisplays.add(d);
    this.getInputsForDisplay(d);

    /* This code makes it so that the displays toggle
        if (this.selectedDisplays.has(d))
            this.selectedDisplays.delete(d);
        else
            this.selectedDisplays.add(d);
        */
  }

  public changeInput(i: Input) {
    if (i.subInputs !== undefined && i.subInputs.length > 0) {
      this.dialog.open(StreamModalComponent, { data: i }).afterClosed().subscribe((theChosenOne) => {
        if (theChosenOne !== undefined) {
          const input = theChosenOne as Input;
          this.command.setInput(this.panel.preset, input, Array.from(this.selectedDisplays))
          .subscribe(success => {
            if (!success) {
              console.warn("failed to change input");
            }
          });
        }
      });
    } else {
      this.command
      .setInput(this.panel.preset, i, Array.from(this.selectedDisplays))
      .subscribe(success => {
        if (!success) {
          console.warn("failed to change input");
        }
      });
    }
  }

  public blank() {
    this.command
      .setBlank(true, Array.from(this.selectedDisplays))
      .subscribe(success => {
        if (!success) {
          console.warn("failed to blank");
        }
      });
  }

  public setMasterMute(muted) {
    // if (muted) {
    //   this.preset.beforeMuteLevel = this.preset.masterVolume;
    //   // this.command.setMasterVolume(0, this.preset);
    //   this.command.setMasterMute(muted, this.preset);
    // } else {
    //   // this.command.setMasterVolume(this.preset.beforeMuteLevel, this.preset);
    //   this.command.setMasterMute(muted)
    // }
    this.command.setMasterMute(muted, this.panel.preset);
  }

  public inputUsed(i: Input): boolean {
    const selected = Array.from(this.selectedDisplays);

    for (const d of selected) {
      // because blank is treated like an input
      if (d.blanked || d.input == null) {
        continue;
      }

      if (d.input.name === i.name) {
        return true;
      }

      if (i.subInputs !== undefined && i.subInputs.length > 0) {
        for (const sub of i.subInputs) {
          if (d.input.name === sub.name) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public isOneBlanked(): boolean {
    const selected = Array.from(this.selectedDisplays);

    for (const d of selected) {
      if (d.blanked) {
        return true;
      }
    }

    return false;
  }

  public openInputDialog(i: Input) {
    const config = this.data.getInputConfiguration(i);

    switch (config.type._id) {
      case "via-connect-pro":
        console.log("opening via control dialog for", i);
        const dialogRef = this.dialog.open(ViaDialog, {
          width: "50vw",
          data: { via: i },
          disableClose: true
        });
        break;
      default:
        console.log("nothing to do for type", config.type._id);
        break;
    }
  }

  public getSelectedDisplayNames(): string[] {
    const displays: string[] = [];
    this.selectedDisplays.forEach(d => {
      displays.push(d.name);
    });

    return displays;
  }

  public separateInputs(p: Panel): boolean {
    return p.features.includes("displaysSeparateInputs")
  }

  public getInputsForDisplay(d: Display) {
    var tempInputs = new Array<Input>();

    for (const [key, value] of Object.entries(this.data.inputReachability)) {
      if (value.includes(d.name)) {
        tempInputs.push(this.panel.preset.inputs.find(x => x.name == key))
      }
    }

    this.inputs = tempInputs;
  }
}
