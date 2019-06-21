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
  pages: number[] = [];
  curPage: number;
  displayPages: number[] = [];
  curDisplayPage: number;

  audioTypes: string[]; // used to do optimize change detection (mostly at the beginning)

  constructor(public command: CommandService, private ref: ChangeDetectorRef) {
    
  }

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

    if (this.preset != null) {
      this.preset.independentAudioDevices.push({name: "MIC7"}, {name: "MIC8"});
      this.preset.audioDevices.push({name: "D3"}, {name: "D4"});
      const pages = Math.ceil(this.preset.independentAudioDevices.length / 5);
      this.pages = new Array(pages).fill(undefined).map((x, i) => i);
  
      console.log("mics:", this.preset.independentAudioDevices.length, "pages:", this.pages);
      this.curPage = 0;

      const dispPages = Math.ceil(this.preset.audioDevices.length / 3);
      this.displayPages = new Array(dispPages).fill(undefined).map((x, i) => i);
  
      console.log("displays:", this.preset.audioDevices.length, "pages:", this.displayPages);
      this.curDisplayPage = 0;
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

  pageLeft = () => {
    if (this.canPageLeft()) {
      this.curPage--;
    }

    // scroll to the bottom of the page
    const idx = 5 * this.curPage;
    document.querySelector("#device" + idx).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  pageRight = () => {
    if (this.canPageRight()) {
      this.curPage++;
    }

    // scroll to the top of the page
    const idx = 5 * this.curPage;
    document.querySelector("#device" + idx).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
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

  pageDispLeft = () => {
    if (this.canPageDispLeft()) {
      this.curDisplayPage--;
    }

    // scroll to the bottom of the page
    const idx = 3 * this.curDisplayPage;
    document.querySelector("#display" + idx).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  pageDispRight = () => {
    if (this.canPageDispRight()) {
      this.curDisplayPage++;
    }

    // scroll to the top of the page
    const idx = 3 * this.curDisplayPage;
    document.querySelector("#display" + idx).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  canPageDispLeft = (): boolean => {
    if (this.curDisplayPage <= 0) {
      return false;
    }

    return true;
  };

  canPageDispRight = (): boolean => {
    if (this.curDisplayPage + 1 >= this.displayPages.length) {
      return false;
    }

    return true;
  };
}
