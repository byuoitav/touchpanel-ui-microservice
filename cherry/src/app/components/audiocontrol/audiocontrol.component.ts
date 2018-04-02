import { 
    Component, 
    AfterViewInit, 
    Input, 
    ViewChild,
    OnChanges } from '@angular/core';

import { CommandService } from '../../services/command.service';

import { Preset } from '../../objects/objects';
import { AudioDevice } from '../../objects/status.objects';

@Component({
  selector: 'audiocontrol',
  templateUrl: './audiocontrol.component.html',
  styleUrls: ['./audiocontrol.component.scss'],
})
export class AudiocontrolComponent implements AfterViewInit, OnChanges {

    @ViewChild('tabGroup') tabGroup;
    @Input() preset: Preset;

    audioTypes: string[]; // used to do optimize change detection (mostly at the beginning)

    constructor(public command: CommandService) {}

    ngAfterViewInit() {
        // this is disgusting. :(
        // but, it moves the second line of tabs to be left aligned
        this.tabGroup._elementRef.nativeElement.getElementsByClassName("mat-tab-labels")[0].style.justifyContent = "flex-start";
    }

    ngOnChanges(changes) {
        setTimeout(() => {
            this.updateAudioTypes();
        })
    }

    private updateAudioTypes() {
        if (this.preset != null) {
            this.audioTypes = Array.from(this.preset.audioTypes.keys());
        }
    }

    public setMasterMute(muted: boolean) {
        if (muted) {
            this.preset.beforeMuteLevel = this.preset.masterVolume;
            this.command.setMasterVolume(0, this.preset);
        } else {
            this.command.setMasterVolume(this.preset.beforeMuteLevel, this.preset);
        }
    }
}