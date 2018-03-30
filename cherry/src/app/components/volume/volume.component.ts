import { Component, Input, Output, EventEmitter } from '@angular/core';

import { CommandService } from '../../services/command.service';

import { AudioDevice } from '../../objects/status.objects';

@Component({
  selector: 'volume',
  templateUrl: './volume.component.html',
  styleUrls: ['./volume.component.scss']
})
export class VolumeComponent {

    @Input() level: number;
    @Input() mute: boolean;

    @Output() levelChange: EventEmitter<int> = new EventEmitter();
    @Output() muteChange: EventEmitter<MuteStatus> = new EventEmitter();

    beforeMuteLevel: number;

    constructor(private command: CommandService) {}

    public muteClick() {
        let level: number;
        if (this.mute) {
            // was muted before, emitting false, returning vol to prev level
            this.level = this.beforeMuteLevel;
            level = this.beforeMuteLevel;
        } else {
            // wasn't muted before, emitting true 
            this.beforeMuteLevel = this.level;
            level = 0;
        }

        let emit = new MuteStatus(level, !this.mute);
        console.log("emitting", emit)

        //this.muteChange.emit(new MuteStatus(level, !this.mute));
        this.muteChange.emit(emit);
    }
}

export class MuteStatus {
    level: number;
    muted: boolean;

    constructor(level: number, muted: boolean) {
        this.level = level;
        this.muted = muted;
    }
}
