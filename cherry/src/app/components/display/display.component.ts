import { Component, Input as AngularInput } from '@angular/core';

import { DataService } from '../../services/data.service';
import { CommandService } from '../../services/command.service';

import { Preset } from '../../objects/objects';
import { Display, AudioDevice, Input } from '../../objects/status.objects';

@Component({
  selector: 'display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent {

    @AngularInput() preset: Preset; 

    selectedDisplays: Set<Display> = new Set();

    constructor(private data: DataService, public command: CommandService) {}

    public toggleDisplay(d: Display) {
        this.selectedDisplays.clear();
        this.selectedDisplays.add(d);
        /*
        if (this.selectedDisplays.has(d))
            this.selectedDisplays.delete(d);
        else 
            this.selectedDisplays.add(d);
        */
    }

    public changeInput(i: Input) {
        this.command.setInput(i, Array.from(this.selectedDisplays)).subscribe(success => {
            if (!success) 
                console.warn("failed to change input")
        });
    }

    public blank() {
        this.command.setBlank(true, Array.from(this.selectedDisplays)).subscribe(success => {
            if (!success)
                console.warn("failed to blank")
        });
    }

    public setMasterMute(muted) {
        if (muted) {
            this.preset.beforeMuteLevel = this.preset.masterVolume;
            this.command.setMasterVolume(0, this.preset);
        } else {
            this.command.setMasterVolume(this.preset.beforeMuteLevel, this.preset);
        }
    }

    public inputUsed(i: Input): boolean {
        const selected = Array.from(this.selectedDisplays)

        for (let d of selected) {
            // because blank is treated like an input
            if (d.blanked)
                continue

            if (d.input.name == i.name) 
                return true;
        }

        return false;
    }

    public isOneBlanked(): boolean {
        const selected = Array.from(this.selectedDisplays)

        for (let d of selected) {
            if (d.blanked) 
                return true;
        }

        return false;
    }
}
