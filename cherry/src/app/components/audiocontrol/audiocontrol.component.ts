import {
  Component,
  AfterViewInit,
  Input,
  ViewChild,
  OnChanges,
  ChangeDetectorRef
} from "@angular/core";
import {MatTabGroup} from "@angular/material/tabs";

import {CommandService} from "../../services/command.service";
import {Preset} from "../../objects/objects";

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

  groupPages: Map<string, number[]> = new Map();
  groupCurPage: Map<string, number> = new Map();

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

    // this is disgusting. :(
    // but, it moves the second line of tabs to be left aligned
    this.tabs._elementRef.nativeElement.getElementsByClassName(
      "mat-mdc-tab-labels"
    )[0].style.justifyContent = "flex-start";


  }

  ngOnChanges(changes) {
    if (this.preset.audioTypes != null) {
      setTimeout(() => {
        this.updateAudioTypes();
      });
    }

    if (this.preset != null) {
      // this.preset.independentAudioDevices.push(
      //   new AudioDevice(
      //     "MIC7",
      //     "Mic 7",
      //     "on",
      //     null,
      //     false,
      //     30,
      //     "mic",
      //     "Microphone",
      //     100
      //   ),
      //   new AudioDevice(
      //     "MIC8",
      //     "Mic 8",
      //     "on",
      //     null,
      //     false,
      //     30,
      //     "mic",
      //     "Microphone",
      //     100
      //   )
      // );
      // this.preset.audioDevices.push(
      //   new AudioDevice(
      //     "D3",
      //     "Display 3",
      //     "on",
      //     null,
      //     false,
      //     30,
      //     "videocam",
      //     "ADCP Sony VPL",
      //     100
      //   ),
      //   new AudioDevice(
      //     "D4",
      //     "Display 4",
      //     "on",
      //     null,
      //     false,
      //     30,
      //     "videocam",
      //     "ADCP Sony VPL",
      //     100
      //   )
      // );
      const pages = Math.ceil(this.preset.independentAudioDevices.length / 4);
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
    if (this.preset.audioTypes != null) {
      if (this.preset != null) {
        this.audioTypes = Array.from(this.preset.audioTypes.keys());

        if (this.audioTypes != null && this.audioTypes.length) {
          for (const type of this.audioTypes) {
            const p = Math.ceil(this.preset.audioTypes.get(type).length / 4);
            const tempPages = new Array(p).fill(undefined).map((x, i) => i);
            this.groupPages.set(type, tempPages);

            console.log("audio group ", type, "pages:", this.groupPages.get(type));
            this.groupCurPage.set(type, 0);
          }
        }
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
    const idx = 4 * this.curPage;
    document.querySelector("#device" + idx).scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
  }

  pageRight = () => {
    if (this.canPageRight()) {
      this.curPage++;
    }

    // scroll to the top of the page
    const idx = 4 * this.curPage;
    document.querySelector("#device" + idx).scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
  }

  canPageLeft = (): boolean => {
    if (this.curPage <= 0) {
      return false;
    }

    return true;
  }

  canPageRight = (): boolean => {
    if (this.curPage + 1 >= this.pages.length) {
      return false;
    }

    return true;
  }

  pageDispLeft = () => {
    if (this.canPageDispLeft()) {
      this.curDisplayPage--;
    }

    // scroll to the bottom of the page
    const idx = 3 * this.curDisplayPage;
    document.querySelector("#display" + idx).scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
  }

  pageDispRight = () => {
    if (this.canPageDispRight()) {
      this.curDisplayPage++;
    }

    // scroll to the top of the page
    const idx = 3 * this.curDisplayPage;
    document.querySelector("#display" + idx).scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
  }

  canPageDispLeft = (): boolean => {
    if (this.curDisplayPage <= 0) {
      return false;
    }

    return true;
  }

  canPageDispRight = (): boolean => {
    if (this.curDisplayPage + 1 >= this.displayPages.length) {
      return false;
    }

    return true;
  }

  onMasterVolumeLevelChange(v: number, preset: Preset) {
    this.command.setMasterVolume(v, preset);
    if (preset.masterMute) {
      this.command.setMasterMute(false, preset);
    }
    this.command.buttonPress("master volume set", {level: v});
  }


  groupPageLeft(groupName: string) {
    if (this.groupCanPageLeft(groupName)) {
      let pNum = this.groupCurPage.get(groupName);
      pNum--;
      this.groupCurPage.set(groupName, pNum);
    }

    // scroll to the bottom of the page
    const idx = 5 * this.groupCurPage.get(groupName);
    document.querySelector("#" + groupName + idx).scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
  }

  groupPageRight(groupName: string) {
    if (this.groupCanPageRight(groupName)) {
      let pNum = this.groupCurPage.get(groupName);
      pNum++;
      this.groupCurPage.set(groupName, pNum);
    }

    // scroll to the bottom of the page
    const idx = 5 * this.groupCurPage.get(groupName);
    document.querySelector("#" + groupName + idx).scrollIntoView({behavior: "smooth", block: "nearest", inline: "start"});
  }

  groupCanPageLeft(groupName: string): boolean {
    if (this.groupCurPage.get(groupName) <= 0) {
      return false;
    }

    return true;
  }

  groupCanPageRight(groupName: string): boolean {
    if (this.groupCurPage.get(groupName) + 1 >= this.groupPages.get(groupName).length) {
      return false;
    }

    return true;
  }
}
