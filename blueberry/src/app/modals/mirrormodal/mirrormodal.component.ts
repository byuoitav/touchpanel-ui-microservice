import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { APIService } from "../../services/api.service";
import { CommandService } from "../../services/command.service";
import { Input } from "../../objects/status.objects";
import { Preset } from "../../objects/objects";
import { AudioComponent } from "../../components/audio/audio.component";

@Component({
  selector: "mirrormodal",
  templateUrl: "./mirrormodal.component.html",
  styleUrls: ["./mirrormodal.component.scss"]
})
export class MirrorModalComponent implements OnInit {
  constructor(
    public ref: MatDialogRef<MirrorModalComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      preset: Preset;
      unmirror: () => (() => Promise<boolean>);
      input: Input;
    }
  ) {
    console.log("unmirror", this.data.unmirror);
  }

  ngOnInit() {
    this.ref.disableClose = true;
  }

  /*
  toAudioControl = () => {
    const ref = this.dialog.open(AudioModalComponent, {
      width: "80vw",
      disableClose: true,
      data: this.data.preset
    });

    // TODO on closed, reopen this one
  };
  */
}
