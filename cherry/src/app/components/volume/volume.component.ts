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

    @Output() levelChange: EventEmitter<number> = new EventEmitter();
    @Output() muteChange: EventEmitter<MuteStatus> = new EventEmitter();

    public beforeMuteLevel: number;

    constructor(private command: CommandService) {}

    public muteClick() {
        let emit: MuteStatus;
        if (this.mute) {
            emit = new MuteStatus(this.beforeMuteLevel, false);
        } else {
            this.beforeMuteLevel = this.level;
            emit = new MuteStatus(0, true);
        }

        this.muteChange.emit(emit)
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