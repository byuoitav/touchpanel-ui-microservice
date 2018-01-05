import { Component, ViewChild,  EventEmitter, Output as AngularOutput, OnInit } from '@angular/core';
import { deserialize } from 'serializer.ts/Serializer';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { SwalComponent, SwalPartialTargets } from '@toverux/ngx-sweetalert2';

import { WheelComponent } from './wheel.component';
import { DataService } from '../services/data.service';
import { APIService } from '../services/api.service';
import { GraphService } from '../services/graph.service';
import { SocketService, MESSAGE, EventWrapper, Event } from '../services/socket.service';
import { HelpDialog } from '../dialogs/help.dialog';
import { ChangedDialog } from '../dialogs/changed.dialog';

import { Preset, AudioConfig } from '../objects/objects';
import { Output, Display, AudioDevice, INPUT, Input, DTA, POWER, SHARING, POWER_OFF_ALL, MIRROR } from '../objects/status.objects';

@Component({
    selector: 'home',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss', '../colorscheme.scss']
})
export class HomeComponent implements OnInit {

    @ViewChild(WheelComponent)
    public wheel: WheelComponent;

    sharePreset: Preset;
    preset: Preset;

    selectedDisplays: Display[] = [];
    shareableDisplays: Display[] = [];

    mirrorNumber: string;

    @ViewChild("poweroffall") powerOffAllDialog: SwalComponent;
    @ViewChild("help") helpDialog: SwalComponent;
    @ViewChild("helpConfirm") helpConfirmDialog: SwalComponent;
    @ViewChild("selectdisplays") selectDisplaysDialog: SwalComponent;
    @ViewChild("unshare") unShareDialog: SwalComponent;
    @ViewChild("mirror") mirrorDialog: SwalComponent;

    constructor(public data: DataService, private socket: SocketService, public api: APIService, public readonly swalTargets: SwalPartialTargets, private graph: GraphService) {
        this.graph.init();
        this.updateFromEvents();
    }

    public ngOnInit() {
        this.setupDialogs();
    }

    private setupDialogs() {
        this.powerOffAllDialog.options = {
            title: "Power Off All",
            type: "warning",
            text: "i should be hidden",
            focusConfirm: false,
            confirmButtonText: "Yes",
            showCancelButton: true,
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return new Promise((resolve, reject) => {
                    this.wheel.command.powerOffAll().subscribe(
                        success => {
                            if (success) {
                                let event: Event = new Event(0, 0, APIService.piHostname, " ", POWER_OFF_ALL, " ");
                                this.api.sendFeatureEvent(event);

                                resolve();
                            }
                            reject();
                        }
                    );
                });
            },
        };

        this.helpDialog.options = {
            title: "Help",
            type: "question",
            text: "i should be hidden",
            focusConfirm: false,
            confirmButtonText: "Request Help",
            showCancelButton: true,
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return new Promise((resolve, reject) => {
                    this.api.help("help").subscribe(
                        data => {
                            resolve();
                        }, err => {
                            reject();
                        }
                    );
                });
            },
        };

        this.helpConfirmDialog.options = {
            title: "Confirm",
            type: "success",
            text: "i should be hidden",
            focusConfirm: false,
            confirmButtonText: "Confirm",
            showCancelButton: true,
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return new Promise((resolve, reject) => {
                    this.api.help("confirm").subscribe(
                        data => {
                            resolve();
                        }, err => {
                            reject();
                        }
                    );
                });
            },
        }

        this.unShareDialog.options = {
            title: "Returning room to default state...",
            allowOutsideClick: false
        }

        this.mirrorDialog.options = {
            type: "info",
            focusConfirm: false,
            confirmButtonText: "Stop",
            showCancelButton: false,
            allowOutsideClick: false,
            width: "85vw",
        }

        this.selectDisplaysDialog.options = {
            text: "i should be hidden",
            focusConfirm: false,
            confirmButtonText: "Share",
            showCancelButton: true,
            width: "85vw",
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return new Promise((resolve, reject) => {
                    this.share().subscribe(success => {
                        if (success) {
                            this.swalStatus(true);
                            resolve(); 
                        } else {
                            this.swalStatus(false);
                            reject(); 
                        }
                    });
                });
            },
        }
    }

    private onWheelInit() {
        this.preset = this.wheel.preset;

        if (this.wheel.getPower() == "on") {
            this.wheel.open(false, 500);
        }
    }

    public turnOn(): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = this.wheel.command.powerOnDefault(this.wheel.preset);

        ret.subscribe(success => {
            if (success) {
                this.wheel.open(false, 200);
            }
        });

        return ret;
    }

    public turnOff(): EventEmitter<boolean> {
        if (this.wheel.preset === this.sharePreset) {
            this.unShare().subscribe(success => {
                let ret: EventEmitter<boolean> = this.wheel.command.setPower('standby', this.wheel.preset.displays); 
                ret.subscribe(success => {
                    if (success) {
                        this.wheel.close();
                    } 
                });
                return ret;
            });
        } else {
            let ret: EventEmitter<boolean> = this.wheel.command.setPower('standby', this.wheel.preset.displays); 
            ret.subscribe(success => {
                if (success) {
                    this.wheel.close();
                } 
            });
            return ret;
        }
    }

    public openedSelectDisplaysDialog() {
        if (this.wheel.getInput() == null) 
            this.swalStatus(false); 

        this.shareableDisplays.length = 0;
        this.selectedDisplays.length = 0;

        this.graph.getDisplayList().forEach(name => {
            if (!this.wheel.preset.displays.some(d => d.name === name)) {
                let display = this.data.displays.find(d => d.name === name); 
                if (display != null)
                    this.shareableDisplays.push(display);
            }
        });

        // check all displays
        this.shareableDisplays.forEach(name => {
            this.selectedDisplays.push(name);
        });
    }

    public share(): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter();

        this.removeExtraInputs();

        // only control audio on the display that is sharing
        // unless the group includes a roomWideAudio, then control 
        // those audioDevices.
        let audioDevices = this.wheel.preset.audioDevices.slice();
        let audioConfigs = this.data.getAudioConfigurations(this.selectedDisplays);
        let hasRoomWide = this.data.hasRoomWide(audioConfigs);

        if (hasRoomWide) {
            audioDevices.length = 0;

            for (let config of audioConfigs) {
                if (config.roomWide) 
                    audioDevices.push(...config.audioDevices);
            }
        }

        let displays: Display[] = [];
        this.selectedDisplays.forEach(d => displays.push(d));
        this.wheel.preset.displays.forEach(d => displays.push(d));
        
        this.sharePreset = new Preset("Sharing", "subscriptions", displays, audioDevices, this.wheel.preset.inputs, this.wheel.preset.shareableDisplays);
        console.log("sharePreset", this.sharePreset);

        this.wheel.share(this.selectedDisplays).subscribe(
            success => {
                if (success) {
                    this.wheel.preset = this.sharePreset;
                    setTimeout(() => this.wheel.render(), 0);

                    let names: string[] = []; 
                    this.selectedDisplays.forEach(d => {
                        names.push(d.name);

                        let event = new Event(0,0, " ", d.name, SHARING, "remove")
                        this.api.sendFeatureEvent(event);
                    });

                    let device: string = names.join(",");

                    let event: Event = new Event(0, 0, " ", device, DTA, "true");
                    this.api.sendFeatureEvent(event);

                    ret.emit(true);
                } else {
                    this.wheel.preset = this.preset;
                    setTimeout(() => this.wheel.render(), 0);
                    ret.emit(false);
                } 
            }
        );

        return ret;
    }

    // TODO make unShare use audioConfigs instead 
    // of using the same name for display/audio. see function for sharing.  
    public unShare(): EventEmitter<boolean> {
        swal.showLoading();
        let ret: EventEmitter<boolean> = new EventEmitter();

        let audioDevices: AudioDevice[] = [];
        for (let d of this.wheel.preset.displays) {
            let a = this.data.audioDevices.find(a => a.name == d.name);
            if (a != null) {
                audioDevices.push(a);
            }
        }

        this.sharePreset.displays = this.sharePreset.displays.filter(d => !this.preset.displays.includes(d));
        
        this.wheel.unShare(this.sharePreset.displays, audioDevices).subscribe(
            success => {
                if (success) {
                    let names: string[] = []; 
                    this.selectedDisplays.forEach(d => names.push(d.name));
                    let device: string = names.join(",");

                    let event: Event = new Event(0, 0, " ", device, DTA, "false");
                    this.api.sendFeatureEvent(event);

                    this.wheel.preset = this.preset;
                    setTimeout(() => this.wheel.render(), 0);

                    this.swalStatus(true);
                    ret.emit(true);
                } else {
                    this.swalStatus(false);
                    ret.emit(false);
                }
            }
        );

        return ret;
    }

    public mirror(preset: Preset) {
        this.wheel.command.mirror(preset, this.wheel.preset);

        let names: string[] = [];
        this.wheel.preset.displays.forEach(d => names.push(d.name));
        let device: string = names.join(",");

        let event: Event = new Event(0, 0, " ", device, SHARING, "add");
        this.api.sendFeatureEvent(event);
    }

    public unMirror() {
        let names: string[] = [];
        this.wheel.preset.displays.forEach(d => names.push(d.name));
        let device: string = names.join(",");

        let event: Event = new Event(0, 0, " ", device, SHARING, "remove");
        this.api.sendFeatureEvent(event);

        // switch the input back to default
        this.wheel.command.powerOnDefault(this.data.panel.preset);
    }

    private updateFromEvents() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let ew: EventWrapper = event.data;
                let e: Event = ew.event;

                switch(e.eventInfoKey) {
                    case POWER: {
                        if (e.eventInfoValue == "standby" && this.wheel.preset.displays.find(d => d.name === e.device) != null) {
                            this.removeExtraInputs();
                        }
                    }
                    case INPUT: {
                        if (APIService.piHostname !== ew.hostname) {
                            break;
                        }

                        if (this.preset.displays.find(d => d.name === e.device) == null) {
                            break;
                        }

                        let input = Input.getInput(e.eventInfoValue, this.data.inputs);

                        if (input != null) {
                            console.log("Creating a new input on the wheel from event:", e);

                            input.displayname = "Station " + this.numberFromHostname(ew.hostname);
                            input.click.subscribe(() => {
                                let panel = this.data.panels.find(p => p.hostname === ew.hostname);

                                if (panel != null) {
                                    this.mirror(panel.preset);

                                    this.mirrorNumber = this.numberFromHostname(ew.hostname);
                                    this.mirrorDialog.show();
                                } else {
                                    console.error("failed to find panel with hostname", ew.hostname, ". panels: ", this.data.panels);
                                }
                            });

                            this.preset.extraInputs.length = 0;
                            this.preset.extraInputs.push(input); 

                            setTimeout(() => this.wheel.render(), 0);
                        }
                        break; 
                    }
                    case DTA: {
                        console.log("dta event", e);

                        // Device field on DTA determines what devices got changed. If one of mine did, then show the popup.
                        let names: string[] = e.device.split(",");

                        let showPopup: boolean = false;
                        this.wheel.preset.displays.forEach(d => {
                            if (names.includes(d.name))
                                showPopup = true;
                        });

                        if (showPopup) {
                            if (e.eventInfoValue === "true" && ew.hostname !== APIService.piHostname) {

                                if (this.wheel.preset == this.sharePreset) {
                                    let minions: string[] = [];
                                    this.selectedDisplays.forEach(d => {
                                        if (!this.preset.displays.includes(d))
                                            minions.push(d.name);
                                    });
                                    let device: string = minions.join(",");

                                    let event = new Event(0, 0, "", device, MIRROR, ew.hostname);
                                    this.api.sendFeatureEvent(event);

                                    event = new Event(0, 0, ew.hostname, device, DTA, "true");
                                    this.api.sendFeatureEvent(event);

                                    this.wheel.preset = this.preset;
                                    setTimeout(() => this.wheel.render(), 0);
                                }

                                this.mirrorDialog.show();
                            } else {
                                if (this.mirrorNumber === this.numberFromHostname(ew.hostname)) {
                                    this.removeExtraInputs();
                                    swal.close();
                                }
                            }
                        }
                        break; 
                    }
                    case MIRROR: {
                        console.log("mirror event", e);
                        let names: string[] = e.device.split(",");

                        // if the mirror event applies to me
                        if(this.wheel.preset.displays.some(d => names.includes(d.name))) {
                            let panelToMirror = this.data.panels.find(p => p.hostname === ew.hostname);
                            console.log("mirroring preset:", panelToMirror.preset);
                            this.mirror(panelToMirror.preset);

                            this.mirrorNumber = this.numberFromHostname(ew.hostname);
                        }
                    }
                    case SHARING: {
                        console.log("sharing event", e);
                        if (this.sharePreset == this.wheel.preset) {
                            // TODO edit sharePreset.audioDevices based on add/remove events
                            //      if a roomWideAudio is added, send a request to change audio over there.
                            //      if a roomWideAudio is removed, send a request to change audio back to the me (the master)
                            let names = e.device.split(","); 

                            // remove the name if it's on my default preset (those ones should never be added/removed - at least for now)
                            names = names.filter(n => !this.preset.displays.some(d => d.name === n));

                            if (names == null || names.length == 0)
                                break;

                            if (e.eventInfoValue === "remove") {
                                console.log("removing", names, "from", this.sharePreset.displays);
                                // filter out the ones by the names that just came through, unless it's a name from my default preset
                                this.sharePreset.displays = this.sharePreset.displays.filter(d => !names.includes(d.name));

                                console.log("leftover displays in sharePreset:", this.sharePreset);

                                // if a room-wide audio is removed, send a reuqest to change my audio to default.
                                // also, edit sharePreset.audioDevices so that the correct device(s) is/are controlled. 
                                
                                // create an array of displays that were removed
                                let displays: Display[] = [];
                                this.data.displays.filter(d => names.includes(d.name))
                                                  .forEach(d => displays.push(d));

                                console.log("displays that were removed", displays);

                                // get audioConfigs of removed displays
                                let audioConfigs = this.data.getAudioConfigurations(displays);
                                console.log("audioConfigs of removed displays", audioConfigs);
                                let hasRoomWide = this.data.hasRoomWide(audioConfigs);

                                if (hasRoomWide) {
                                    console.log("removed room wide audio device. changing preset...");
                                    // change the audioDevices
                                    this.sharePreset.audioDevices = this.preset.audioDevices;
                                    console.log("share preset audio devices changed to: ", this.sharePreset);

                                    this.wheel.command.setVolume(30, this.sharePreset.audioDevices);
                                    this.wheel.command.setMute(false, this.sharePreset.audioDevices);
                                } else
                                    console.log("no room wide audioDevice was removed");

                                console.log("removed displays. now mirroring to", this.wheel.preset.displays);
                            } else if (e.eventInfoValue === "add") {
                                let displays: Display[] = [];
                                this.data.displays.filter(d => names.includes(d.name))
                                                  .forEach(d => displays.push(d));

                                this.sharePreset.displays.push(...displays);
                                this.selectedDisplays.push(...displays);

                                // get audioConfigs of added displays
                                let audioConfigs = this.data.getAudioConfigurations(displays);
                                console.log("audioConfigs of added displays", audioConfigs);
                                let hasRoomWide = this.data.hasRoomWide(audioConfigs);

                                if (hasRoomWide) {
                                    console.log("added room wide audio device. changing preset...");

                                    // mute current audioDevice
                                    console.log("muting old audioDevices");
                                    this.wheel.command.setMute(true, this.sharePreset.audioDevices);
                                    this.wheel.command.setVolume(0, this.sharePreset.audioDevices);

                                    // change the audioDevices
                                    this.sharePreset.audioDevices.length = 0;

                                    for (let config of audioConfigs) {
                                        if (config.roomWide) 
                                            this.sharePreset.audioDevices.push(...config.audioDevices);
                                    }
                                    console.log("share preset audio devices changed to: ", this.sharePreset);

                                    this.wheel.command.setVolume(30, this.sharePreset.audioDevices);
                                    this.wheel.command.setMute(false, this.sharePreset.audioDevices);
                                } else
                                    console.log("no room wide audioDevice was added");

                                console.log("added", displays, "to mirror list. now mirroring to", this.wheel.preset.displays);
                            }
                        } 
                        break;
                    }
                    case POWER_OFF_ALL: {
                        this.removeExtraInputs();
                        swal.close();

                        if (this.sharePreset == this.wheel.preset) {
                            this.unShare().subscribe(success => {
                                if (success)
                                    this.wheel.command.powerOffAll();
                            });
                        }
                    }
                }
            }
        }); 
    }

    private numberFromHostname(requestor: string): string {
        let num = requestor.split("-")[2][2];
        return num; 
    }

    private removeExtraInputs() {
        this.wheel.preset.extraInputs.length = 0; 
        setTimeout(() => this.wheel.render(), 0);
    }

    private swalStatus(success: boolean): void {
        if (!swal.isVisible())
            return;

        if (success) {
            swal({
                type: "success",
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            swal({
                type: "error",
                timer: 1500,
                showConfirmButton: false
            });
        } 
    }

    public toggleSelected(d: Display) {
        let index = this.selectedDisplays.indexOf(d);

        if (index === -1) {
            this.selectedDisplays.push(d);
        } else {
            this.selectedDisplays.splice(index, 1);
        }
    }

    public isSelected(d: Display) {
        return this.selectedDisplays.includes(d);
    }
}
