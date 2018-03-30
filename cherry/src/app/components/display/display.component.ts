import { Component, Input } from '@angular/core';

import { DataService } from '../../services/data.service';
import { CommandService } from '../../services/command.service';

import { Preset } from '../../objects/objects';
import { Display, AudioDevice } from '../../objects/status.objects';

@Component({
  selector: 'display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent {

    @Input() preset: Preset; 

    selectedDisplays: Set<Display> = new Set();

    constructor(private data: DataService, private command: CommandService) {}

    public toggleDisplay(d: Display) {
        if (this.selectedDisplays.has(d))
            this.selectedDisplays.delete(d);
        else 
            this.selectedDisplays.add(d);
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
}
