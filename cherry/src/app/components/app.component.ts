import { Component, ViewEncapsulation } from '@angular/core';

import { DataService } from '../services/data.service';
import { CommandService } from '../services/command.service';
import { Output } from '../objects/status.objects';

const HIDDEN = "hidden";
const QUERY = "query";
const LOADING = "indeterminate";

@Component({
    selector: 'cherry',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
    public unlocking: boolean = false;
    public progressMode: string = QUERY;

    private loaded: boolean; 

    constructor(private data: DataService, private command: CommandService) {
        this.loaded = false;
        this.data.loaded.subscribe(() => {
            this.loaded = true;
        })
    }

    public isPoweredOff(): boolean {
        if (!this.loaded)
            return true;
        return Output.getPower(this.data.panel.preset.displays) == 'standby';
    }

    public unlock() {
        this.unlocking = true;
        this.progressMode = QUERY;

        this.command.powerOnDefault(this.data.panel.preset).subscribe(success => {
            if (!success)
                console.warn("failed to turn on");
            else {
                this.unlocking = false;
                this.progressMode = LOADING;
            }
        });
    }

    public powerOff() {
        this.progressMode = QUERY;

        this.command.powerOff(this.data.panel.preset).subscribe(success => {
            if (!success)
                console.warn("failed to turn off");
            else {
                this.unlocking = false;
            }
        });
    }
}
