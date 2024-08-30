import { NgxSliderModule } from "@angular-slider/ngx-slider";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ViewChild
} from "@angular/core";
import { MatSliderModule, MatSliderThumb } from "@angular/material/slider";

import { Options, ChangeContext, PointerType } from '@angular-slider/ngx-slider';

@Component({
  selector: "volume",
  templateUrl: "./volume.component.html",
  styleUrls: ["./volume.component.scss"],
  encapsulation: ViewEncapsulation.Emulated
})
export class VolumeComponent {
  @Input() level: number;
  @Input() mute: boolean;

  options: Options = {
    floor: 0,
    ceil: 100,
    step: 5,
    vertical: true,
    showSelectionBar: true,
  };

  @Output() levelChange: EventEmitter<number> = new EventEmitter();
  @Output() muteChange: EventEmitter<MuteStatus> = new EventEmitter();

  public beforeMuteLevel: number;

  @ViewChild("slider")
  slider: MatSliderModule;

  @ViewChild("thumb")
  thumb: MatSliderThumb;

  constructor() {
    this.level = 0;
    this.mute = false;
    this.beforeMuteLevel = 0;
  }
  ngOnInit() {}

  public muteClick() {
    let emit: MuteStatus;
    if (this.mute) {
      emit = new MuteStatus(this.beforeMuteLevel, false);
    } else {
      this.beforeMuteLevel = this.level;
      emit = new MuteStatus(0, true);
    }
    this.mute = !this.mute;
    this.muteChange.emit(emit);
    console.log("muteClick: level(" + emit.level + ") mute(" + emit.muted + ")");
  }

  public closeThumb() {
    setTimeout(() => {
      this.thumb.blur();
    }, 2000);
  }

  public onLevelChange(changeContext: ChangeContext): void {
    this.levelChange.emit(changeContext.value);
    if (changeContext.pointerType === PointerType.Min) {
      this.closeThumb();
    }

    if (changeContext.pointerType === PointerType.Max) {
      this.closeThumb();
    }

    //if is mute and change level, unmute
    if (this.mute) {
      this.muteClick();
    }

    //if level is 0, mute
    if (changeContext.value === 0) {
      this.muteClick();
    }
    
    console.log("onUserChange: level(" + changeContext.value + ") mute(" + this.mute + ")");
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
