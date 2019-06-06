import {
  Component,
  OnInit,
  Input,
  Output,
  ViewChild,
  EventEmitter
} from "@angular/core";
import { MatSlider } from "@angular/material";

@Component({
  selector: "volume",
  templateUrl: "./volume.component.html",
  styleUrls: ["./volume.component.scss"]
})
export class VolumeComponent implements OnInit {
  @Input()
  level: number;
  @Input()
  mute: boolean;

  @Input()
  muteType: string;

  @Output()
  levelChange: EventEmitter<number> = new EventEmitter();
  @Output()
  muteChange: EventEmitter<MuteStatus> = new EventEmitter();

  public beforeMuteLevel: number;

  @ViewChild("slider")
  slider: MatSlider;

  constructor() {}
  ngOnInit() {}

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
      this.slider._elementRef.nativeElement.blur();
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
