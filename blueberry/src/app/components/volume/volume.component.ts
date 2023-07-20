import {
  Component,
  OnInit,
  Input,
  Output,
  ViewChild,
  EventEmitter
} from "@angular/core";
import { MatSliderModule } from "@angular/material/slider";

@Component({
  selector: "volume",
  templateUrl: "./volume.component.html",
  styleUrls: ["./volume.component.scss"],
})
export class VolumeComponent implements OnInit {
  thumbLabel = true;
  vertical = true;
  @Input()
  level: number;
  @Input()
  mute: boolean;
  @Input() name: string;
  value: number;
  

  @Input()
  muteType: string;

  @Output()
  levelChange: EventEmitter<number> = new EventEmitter();
  @Output()
  muteChange: EventEmitter<boolean> = new EventEmitter();

  @ViewChild("slider")
  slider: MatSliderModule;

  constructor() {}
  ngOnInit() {}

  public closeThumb() {
    setTimeout(() => {
      this.thumbLabel = false;
    } 
    , 2000);
  }
}
