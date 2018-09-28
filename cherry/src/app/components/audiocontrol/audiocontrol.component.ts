import {
  Component,
  AfterViewInit,
  Input,
  ViewChild,
  OnChanges,
  ChangeDetectorRef
} from "@angular/core";
import { MatTabGroup } from "@angular/material/tabs";

import { CommandService } from "../../services/command.service";
import { Preset } from "../../objects/objects";
import { AudioDevice } from "../../objects/status.objects";

@Component({
  selector: "audiocontrol",
  templateUrl: "./audiocontrol.component.html",
  styleUrls: ["./audiocontrol.component.scss"]
})
export class AudiocontrolComponent implements AfterViewInit, OnChanges {
  @ViewChild("tabs")
  tabs: MatTabGroup;
  @Input()
  preset: Preset;
  @Input()
  audioGroups: boolean;

  audioTypes: string[]; // used to do optimize change detection (mostly at the beginning)

  constructor(public command: CommandService, private ref: ChangeDetectorRef) {}

  ngAfterViewInit() {
    if (!this.audioGroups) {
      console.info("not showing audio groups");
    }

    // this is disgusting. :(
    // but, it moves the second line of tabs to be left aligned
    this.tabs._elementRef.nativeElement.getElementsByClassName(
      "mat-tab-labels"
    )[0].style.justifyContent = "flex-start";
  }

  ngOnChanges(changes) {
    if (this.audioGroups) {
      setTimeout(() => {
        this.updateAudioTypes();
      });
    }
  }

  private updateAudioTypes() {
    if (this.audioGroups) {
      if (this.preset != null) {
        this.audioTypes = Array.from(this.preset.audioTypes.keys());
      }
    }
  }

  public setMasterMute(muted: boolean) {
    if (muted) {
      this.preset.beforeMuteLevel = this.preset.masterVolume;
      this.command.setMasterVolume(0, this.preset);
    } else {
      this.command.setMasterVolume(this.preset.beforeMuteLevel, this.preset);
    }
  }
}
