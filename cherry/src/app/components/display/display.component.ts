import { Component, OnInit, Input } from '@angular/core';

import { Preset } from '../../objects/objects';

@Component({
  selector: 'display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent {

    @Input() preset: Preset; 

    constructor() {}
}
