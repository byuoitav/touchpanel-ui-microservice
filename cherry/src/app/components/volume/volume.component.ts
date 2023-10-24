import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ViewChild
} from "@angular/core";
import { MatSliderModule, MatSliderThumb } from "@angular/material/slider";

import { Options } from "ngx-slider-v2";

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

  @ViewChild("slider")
  slider: MatSliderModule;

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

    this.muteChange.emit(emit);
  }

  public closeThumb() {
    setTimeout(() => {
      this.thumb.blur();
    }, 2000);
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
