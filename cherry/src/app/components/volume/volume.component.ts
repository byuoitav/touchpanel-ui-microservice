import { NgxSliderModule } from "ngx-slider-v2";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ViewChild
} from "@angular/core";
import { MatSliderModule, MatSliderThumb } from "@angular/material/slider";

import { Options, ChangeContext, PointerType } from 'ngx-slider-v2';

@Component({
  selector: "volume",
  templateUrl: "./volume.component.html",
  styleUrls: ["./volume.component.scss"],
  encapsulation: ViewEncapsulation.Emulated
})
export class VolumeComponent {
  @Input()
  level: number;
  @Input()
  mute: boolean;

  options: Options = {
    floor: 0,
    ceil: 100,
    step: 5,
    vertical: true,
    showSelectionBar: true,
  };

  @Output()
  levelChange: EventEmitter<number> = new EventEmitter();
  @Output()
  muteChange: EventEmitter<MuteStatus> = new EventEmitter();

  public beforeMuteLevel: number;

  //@ViewChild("slider")
  //slider: MatSliderModule;

  @ViewChild("slider")
  slider: NgxSliderModule;
  
  @ViewChild("thumb")
  thumb: MatSliderThumb;

  constructor() {}

  public muteClick() {
    let emit: MuteStatus;
    if (this.mute) {
      emit = new MuteStatus(this.beforeMuteLevel, false);
    } else {
      this.beforeMuteLevel = this.level;
      emit = new MuteStatus(0, true);
    }

    console.log("muteClick:emit " + emit.muted + " " + emit.level);
    console.log("muteClick:values " + this.mute + " " + this.level);
    console.log("muteClick:before " + this.beforeMuteLevel);
    this.muteChange.emit(emit);
  }

  public closeThumb() {
    setTimeout(() => {
      this.thumb.blur();
    }, 2000);
  }

  public onUserChange(changeContext: ChangeContext): void {
    console.log("onUserChange: " + changeContext.value);
    this.levelChange.emit(changeContext.value);
  }
}

export class MuteStatus {
  level: number;
  muted: boolean;

  constructor(level: number, muted: boolean) {
    this.level = level;
    this.muted = muted;
  }
}
