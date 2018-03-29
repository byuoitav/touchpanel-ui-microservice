import { Component, OnInit, Input } from '@angular/core';

import { Preset } from '../../objects/objects';
import { Display } from '../../objects/status.objects';

@Component({
  selector: 'display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent {

    @Input() preset: Preset; 
    selectedDisplays: Set<Display> = new Set();

    constructor() {}

    public toggleDisplay(d: Display) {
        if (this.selectedDisplays.has(d))
            this.selectedDisplays.delete(d);
        else 
            this.selectedDisplays.add(d);
    }
}
