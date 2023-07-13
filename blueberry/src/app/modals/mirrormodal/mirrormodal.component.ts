import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

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
      audio: AudioComponent;
      unmirror: () => (() => Promise<boolean>);
      input: Input;
    }
  ) {}

  ngOnInit() {
    this.ref.disableClose = true;
  }
}
