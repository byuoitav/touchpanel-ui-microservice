import { Component, ViewChild,  EventEmitter, Output as AngularOutput } from '@angular/core';
import { MatDialog } from '@angular/material';
import { deserialize } from 'serializer.ts/Serializer';

import { WheelComponent } from './wheel.component';
import { DataService } from '../services/data.service';
import { APIService } from '../services/api.service';
import { SocketService, MESSAGE, Event } from '../services/socket.service';
import { HelpDialog } from '../dialogs/help.dialog';
import { ChangedDialog } from '../dialogs/changed.dialog';

import { Preset } from '../objects/objects';
import { Output, Display, AudioDevice, INPUT, Input, DTA } from '../objects/status.objects';

@Component({
    selector: 'home',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss', '../colorscheme.scss']
})
export class HomeComponent {

    @AngularOutput() lockPress: EventEmitter<any> = new EventEmitter();
    
    constructor(public data: DataService, private dialog: MatDialog, private socket: SocketService) {
        this.updateFromEvents();
    }

    @ViewChild(WheelComponent)
    public wheel: WheelComponent;

    dtaPreset: Preset;
    oldPreset: Preset;
    
    private oldDisplayData: Display[];
    private oldAudioDevicesData: AudioDevice[];

    private onWheelInit() {
        this.wheel.preset.top = "50vh";
        this.wheel.preset.right = "50vw";

        this.oldPreset = this.wheel.preset;

        this.dtaPreset = new Preset("All Displays", "subscriptions", this.data.displays, this.data.audioDevices.filter(a => a.roomWideAudio), this.wheel.preset.inputs);
        this.dtaPreset.top = this.wheel.preset.top;
        this.dtaPreset.right = this.wheel.preset.right;
    }

    public turnOn(): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = this.wheel.command.powerOnDefault(this.wheel.preset);

        ret.subscribe(success => {
            if (success) {
                this.wheel.open(false, 500);
            }
        });

        return ret;
    }

    public lock() {
        this.lockPress.emit(true); 
    }

    public help() {
        let dialogRef = this.dialog.open(HelpDialog, {
            width: '50vw',
            backdropClass: 'dialog-backdrop'
        });

        dialogRef.afterClosed().subscribe(result => {
        });
    }

    public displayToAll() {
        this.oldDisplayData = deserialize<Display[]>(Display, this.data.displays);
        this.oldAudioDevicesData = deserialize<AudioDevice[]>(AudioDevice, this.data.audioDevices);

        this.wheel.displayToAll(this.data.displays, this.data.audioDevices);
        this.wheel.preset = this.dtaPreset;
    }

    public unDisplayToAll() {
        this.wheel.unDisplayToAll(this.oldDisplayData, this.oldAudioDevicesData);

        this.wheel.preset = this.oldPreset;
    }

    private updateFromEvents() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let e: Event = event.data;

                switch(e.eventInfoKey) {
                    case INPUT: {
                        if (this.wheel.preset.displays.find(d => d.name === e.device) == null) {
                            break;
                        }

                        let input = Input.getInput(e.eventInfoValue, this.data.inputs);

                        if (input != null && !this.wheel.preset.inputs.includes(input)) {
                            console.log("Creating a new input on the wheel from event:", e);
                            this.wheel.preset.extraInputs.length = 0;
                            this.wheel.preset.extraInputs.push(input); 
                            setTimeout(() => this.wheel.render(), 0);
                        }
                        break; 
                    } 
                    case DTA: {
                        console.log("DTA Event:", e);
                        if (e.eventInfoValue === "true") {
                            let dialogRef = this.dialog.open(ChangedDialog, {
                                width: '50vw',
                                backdropClass: 'dialog-backdrop',
                                data: { number: this.numberFromHostname(e.requestor), message: "has shared an input with you."} 
                            });
                        } else {
                            // no more extra inputs should be showing
                            this.wheel.preset.extraInputs.length = 0; 
                            setTimeout(() => this.wheel.render(), 0);

                            let dialogRef = this.dialog.open(ChangedDialog, {
                                width: '50vw',
                                backdropClass: 'dialog-backdrop',
                                data: { number: this.numberFromHostname(e.requestor), message: "is no longer sharing an input with you."} 
                            });
                        }
                        break; 
                    }
                }
            }
        }); 
    }

    private numberFromHostname(requestor: string): string {
        let num = requestor.split("-")[2][2];
        return num; 
    }
}
