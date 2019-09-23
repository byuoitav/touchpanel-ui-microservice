import { Component, OnInit, Input as AngularInput } from '@angular/core';
import { ControlGroup, Input, Display, AudioDevice } from 'src/app/objects/control';
import { BFFService } from 'src/app/services/bff.service';
import { IControlTab } from '../control-tab/icontrol-tab';

@Component({
  selector: 'app-single-display',
  templateUrl: './single-display.component.html',
  styleUrls: ['./single-display.component.scss']
})
export class SingleDisplayComponent implements OnInit, IControlTab {
  @AngularInput() cg: ControlGroup;
  @AngularInput() display: Display;
  @AngularInput() displayAudio: AudioDevice;

  constructor(
    private bff: BFFService
  ) {
  }

  ngOnInit() {
    if (this.cg) {
      this.display = this.cg.displays[0];
      this.displayAudio = this.cg.getAudioDevice(this.display.id);
    }
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
