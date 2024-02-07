import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

import { WheelComponent } from "../../components/wheel.component";
import { CommandService } from "../../services/command.service";
import { GraphService } from "../../services/graph.service";
import { DataService } from "../../services/data.service";
import { Input } from "../../objects/status.objects";
import { Preset } from "../../objects/objects";

@Component({
  selector: "sharemodal",
  templateUrl: "./sharemodal.component.html",
  styleUrls: ["./sharemodal.component.scss"]
})
export class ShareModalComponent implements OnInit {
  public colMap = [1, 1, 2, 3, 4, 3, 3, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4];

  public selections: Preset[];
  public selected: Preset[];

  constructor(
    public ref: MatDialogRef<ShareModalComponent>,
    private ds: DataService,
    private command: CommandService,
    private graph: GraphService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      wheel: WheelComponent;
      share: (from: Preset, to: Preset[]) => () => Promise<boolean>;
    }
  ) {}

  ngOnInit() {
    console.log("share modal data:", this.data);

    if (!this.data || !this.data.wheel) {
      console.warn("wheel was undefined when modal opened.");
      this.ref.close();
    }

    if (
      !this.curInput() ||
      this.curInput().reachableDisplays.length === 0 ||
      this.curInput().reachableDisplays.length === 1
    ) {
      setTimeout(() => {
        this.ref.close();
      }, 4000);

      return;
    }

    this.selections = [];

    // create the selected presets list
    this.graph.getPresetList().forEach(pname => {
      // skip the displays in my preset
      if (this.data.wheel.preset.name === pname) {
        return;
      }

      // find the preset that this display is correlated with
      const preset = this.ds.presets.find(p => p.name === pname);

      // skip it if i already have it
      if (this.selections.includes(preset)) {
        return;
      }

      // skip this preset if one of it's displays can't get this input
      for (const disp of preset.displays) {
        if (!this.curInput().reachableDisplays.includes(disp.name)) {
          return;
        }
      }

      this.selections.push(preset);
    });

    if (this.selections.length === 0) {
      setTimeout(() => {
        this.ref.close();
      }, 4000);
    }

    // select all of the presets
    this.selected = this.selections.slice();
  }

  curInput = (): Input => {
    if (!this.data) {
      return null;
    }

    if (!this.data.wheel) {
      return null;
    }

    return this.data.wheel.getInput();
  };

  cancel = () => {
    this.command.buttonPress("close share modal");
    this.ref.close();
  };

  toggle = (p: Preset) => {
    const i = this.selected.indexOf(p);

    if (i === -1) {
      this.command.buttonPress("add preset to share group", p.name);
      this.selected.push(p);
    } else {
      this.command.buttonPress("remove preset from share group", p.name);
      this.selected.splice(i, 1);
    }
  };
}
