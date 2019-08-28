import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'volume-slider',
  templateUrl: './volume-slider.component.html',
  styleUrls: ['./volume-slider.component.scss']
})
export class VolumeSliderComponent implements OnInit {
  muted: boolean = false;

  constructor() { }

  ngOnInit() {
  }

  toggleMute() {
    this.muted = !this.muted;
  }
}
