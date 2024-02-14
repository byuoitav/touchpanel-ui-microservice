import {
  Component,
  OnInit,
  Input,
  Output,
  ViewChild,
  EventEmitter
} from "@angular/core";
import { MatSliderModule } from "@angular/material/slider";

import { Options, ChangeContext } from 'ngx-slider-v2';

@Component({
  selector: "volume",
  templateUrl: "./volume.component.html",
  styleUrls: ["./volume.component.scss"],
})
export class VolumeComponent implements OnInit {
  thumbLabel = true;

  @Input() level: number;
  @Input() mute: boolean;

  @Input() name: string;
  
  @Input() muteType: string;

  options: Options = {
    floor: 0,
    ceil: 100,
    step: 5,
    vertical: true,
    showSelectionBar: true,
  };
  
  @Output() levelChange = new EventEmitter<number>();
  @Output() muteChange = new EventEmitter<boolean>();

  @ViewChild("slider")
  slider: MatSliderModule;

  onLevelChange(event: ChangeContext): void {
    this.level = event.value;
    this.levelChange.emit(this.level);
  }

  constructor() {}
  ngOnInit() {}

  public closeThumb() {
    setTimeout(() => {
      this.thumbLabel = false;
    } 
    , 2000);
  }
}
 