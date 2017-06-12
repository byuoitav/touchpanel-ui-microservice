import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'ring',
  template: `
	<ul class="menu">
  <li class="one">
    <a href="#">
      <span class="icon">icon-1</span>
    </a>
  </li>
  <li class="two">
    <a href="#">
      <span class="icon">icon-2</span>
    </a>
  </li>
  <li class="three">
    <a href="#">
      <span class="icon">icon-3</span>
    </a>
  </li>
  <li class="four">
    <a href="#">
      <span class="icon">icon-4</span>
    </a>
  </li>
  <li class="five">
    <a href="#">
      <span class="icon">icon-5</span>
    </a>
  </li>
  <li class="six">
    <a href="#">
      <span class="icon">icon-6</span>
    </a>
  </li>
</ul>

<svg height="0" width="0">
  <defs>
    <clipPath clipPathUnits="objectBoundingBox" id="sector">
      <path fill="none" stroke="#111" stroke-width="1" class="sector" d="M0.5,0.5 l0.5,0 A0.5,0.5 0 0,0 0.75,.066987298 z"></path>
    </clipPath>
  </defs>
</svg>
	`,
  styleUrls: ['./ring.component.scss']
})
export class RingComponent {
  @ViewChild('ring') ring: ElementRef;

  constructor() { }

  convertToRadians() {

  }
}
