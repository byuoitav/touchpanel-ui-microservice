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

  pages: number[] = [];
  curPage = 0;

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

  ngOnChanges() {
    if (this.cg) {
      const pages = Math.ceil(this.cg.inputs.length / 6);
      this.pages = new Array(pages).fill(undefined).map((x, i) => i);
      console.log('pages:', this.pages.length);
      this.curPage = 0;
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

  onSwipe(evt) {
    const x = Math.abs(evt.deltaX) > 40 ? (evt.deltaX > 0 ? 'right' : 'left') : '';
    const y = Math.abs(evt.deltaY) > 40 ? (evt.deltaY > 0 ? 'down' : 'up') : '';

    console.log(x, y);

    if (x === 'right' && this.canPageLeft()) {
      console.log('paging left...');
      this.pageLeft();
    }
    if (x === 'left' && this.canPageRight()) {
      console.log('paging right...');
      this.pageRight();
    }
  }

  pageLeft = () => {
    if (this.canPageLeft()) {
      this.curPage--;
      console.log('going to page ', this.curPage);
    }

    // scroll to the bottom of the page
    const idx = (6 * this.curPage) + 2;
    document.querySelector('#input' + idx).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }

  pageRight = () => {
    if (this.canPageRight()) {
      this.curPage++;
      console.log('going to page ', this.curPage);
    }

    // scroll to the top of the page
    const idx = (6 * this.curPage) + 2;
    document.querySelector('#input' + idx).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
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
}
