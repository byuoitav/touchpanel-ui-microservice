import { Component, OnInit, Input as AngularInput } from '@angular/core';
import { ControlGroup, Input, Display, AudioDevice } from 'src/app/objects/control';
import { BFFService } from 'src/app/services/bff.service';

@Component({
  selector: 'app-single-display',
  templateUrl: './single-display.component.html',
  styleUrls: ['./single-display.component.scss']
})
export class SingleDisplayComponent implements OnInit {
  @AngularInput() cg: ControlGroup;
  @AngularInput() display: Display;
  @AngularInput() displayAudio: AudioDevice;

  constructor(
    private bff: BFFService
  ) {

  }

  ngOnInit() {
  }

  selectInput = (input: Input) => {
    this.bff.setInput(this.cg, input, [this.display.id]);
  }

  setBlank = () => {
    this.bff.setBlank(this.cg, true, this.display.id);
  }

  setVolume = (level: number) => {
    this.bff.setVolume(this.cg, level, this.displayAudio.id);
  }

  setMute = (muted: boolean) => {
    this.bff.setMute(this.cg, muted, this.displayAudio.id);
  }
}
