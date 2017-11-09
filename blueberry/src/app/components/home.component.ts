import { Component, ViewChild } from '@angular/core';

import { WheelComponent } from './wheel.component';
import { DataService } from '../services/data.service';

@Component({
    selector: 'home',
    template: ` 
        <div *ngIf="data.panel?.render">
            <wheel [blur]="false" [preset]="data.panel.presets[0]" (init)="onWheelInit()"></wheel>
        </div>
    `,
    styles: [` 
    `],
})
export class HomeComponent {
    constructor(private data: DataService) {}

    @ViewChild(WheelComponent)
    public wheel: WheelComponent;

    onWheelInit() {
        this.wheel.preset.top = "50vh";
        this.wheel.preset.right = "50vw";
    }
}
