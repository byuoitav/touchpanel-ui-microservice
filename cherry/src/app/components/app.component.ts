import { Component, ViewEncapsulation } from '@angular/core';

import { DataService } from '../services/data.service';
import { Output } from '../objects/status.objects';

@Component({
    selector: 'cherry',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
    private loaded: boolean; 

    constructor(private data: DataService) {
        this.loaded = false;
        this.data.loaded.subscribe(() => {
            this.loaded = true;
        })
    }

    powerOff(): boolean {
        if (!this.loaded)
            return true;
        return Output.getPower(this.data.panel.preset.displays) == 'standby';
    }
}
