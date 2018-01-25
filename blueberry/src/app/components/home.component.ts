import { Component, ViewChild,  EventEmitter, Output as AngularOutput, OnInit } from '@angular/core';
import { deserialize } from 'serializer.ts/Serializer';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { SwalComponent, SwalPartialTargets } from '@toverux/ngx-sweetalert2';
import { WheelComponent } from './wheel.component'; import { DataService } from '../services/data.service';
import { APIService } from '../services/api.service';
import { GraphService } from '../services/graph.service';
import { SocketService, MESSAGE, EventWrapper, Event } from '../services/socket.service';
import { HelpDialog } from '../dialogs/help.dialog';
import { ChangedDialog } from '../dialogs/changed.dialog';

import { Preset, AudioConfig } from '../objects/objects';
import { Output, Display, AudioDevice, INPUT, Input, POWER, POWER_OFF_ALL } from '../objects/status.objects';

export const SHARE          = "start_share";
export const STOP_SHARE     = "stop_share";
export const LEAVE_SHARE    = "leave_share";
export const JOIN_SHARE     = "join_share";

/*
 * This is where most of the logic in sharing lives. 
 *
 * To start sharing, send an event:
 *      {
 *          requestor: the name of the preset that is sharing,
 *          device: list of displays you are sharing to,
 *          eventInfoKey: SHARE,
 *      }
 * Actions a minion takes upon receiving a SHARE event that applies to them:
 *      - show a modal window that blocks user from pressing anything other than stop
 *          - when stop is pressed, a minion sends a STOP_MIRRORING event (described below) 
 *      - save the name of the preset that is controlling you
 *
 *
 * To stop sharing:
 *      {
 *          requestor: the name of the preset that is stopping sharing,
 *          device: list of displays that you are still controlling (bc some may have left),
 *          eventInfoKey: STOP_SHARE,
 *      }
 * Actions a minion takes upon receiving a STOP_SHARE event that applies to them:
 *      - delete any extra inputs that have been created
 *      - remove the modal window
 *
 *
 * If you are a minion, and want the master to stop controlling your displays, send:
 *      {
 *          requestor: the name of the preset that is controlling you,
 *          device: list of the displays you want removed from being controlled (i.e. your displays),
 *          eventInfoKey: LEAVE_SHARE
 *      }
 *      also, unmute/unblank yourself. 
 * Actions a minion takes upon receiving a LEAVE_SHARE event:
 *      - if the displays in *device* match its displays
 *          - unmute/unblank
 *          - switch back to my local input (?)
 * Actions a master takes upon receiving a LEAVE_SHARE event:
 *      -   remove each display in *device* field from current preset 
 *          - if a roomWideAudio was removed:
 *              - change sharePreset.audioDevices to be your default preset's audioDevices
 *              - unmute your audioDevices
 *
 *
 * If you are a minion who has left the group, and would like to rejoin, send:
 *      {
 *          requestor: the name of the preset that that started the group,
 *          device: list of displays you want to be controlled,
 *          eventInfoKey: JOIN_SHARE
 *      } 
 *      also show the same modal window that appears when receiving a SHARE event
 *      and lookup the status of the preset you would like to join, and mirror that.
 * Actions a minion takes upon receiving a JOIN_SHARE event:
 *      - if their displays are in the *device* field
 *          - lookup the status of the preset defined in the requestor field, and mirror that
 *          - show the SHARE modal window
 * Actions a master takes upon receiving a JOIN_SHARE event:
 *      - add each display from *device* into the current preset.
 *          - if a roomWideAudio was added:
 *              - change sharePreset.audioDevices to be the roomWideAudio.
 *              - mute everything that isn't a roomWideAudio
 */

@Component({
    selector: 'home',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss', '../colorscheme.scss']
})
export class HomeComponent implements OnInit {

    @ViewChild(WheelComponent)
    public wheel: WheelComponent;

    sharePreset: Preset;
    defaultPreset: Preset;

    selectedDisplays: Display[] = [];
    shareableDisplays: Display[] = [];

    mirrorPresetName: string;
//    mirrorNumber: string;

    @ViewChild("poweroffall") powerOffAllDialog: SwalComponent;
    @ViewChild("help") helpDialog: SwalComponent;
    @ViewChild("helpConfirm") helpConfirmDialog: SwalComponent;
    @ViewChild("selectdisplays") selectDisplaysDialog: SwalComponent;
    @ViewChild("unshare") unShareDialog: SwalComponent;
    @ViewChild("mirror") mirrorDialog: SwalComponent;
    @ViewChild("audio") audioDialog: SwalComponent;

    constructor(public data: DataService, private socket: SocketService, public api: APIService, public readonly swalTargets: SwalPartialTargets, private graph: GraphService) {
        this.data.loaded.subscribe(() => {
            this.updateFromEvents();
        })
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
                    this.turnOff().subscribe(() => {
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
                    })
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

        this.audioDialog.options = {
            text: "i should be hidden",
            confirmButtonText: "Done",
            focusConfirm: false,
            showCancelButton: false,
            width: "80vw",
        };
    }

    private onWheelInit() {
        this.defaultPreset = this.wheel.preset;

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

        this.removeExtraInputs(); // if you share, you can't go back to an old group anymore.

        /* create a new preset based on selectedDisplays
         */

        let displays: Display[] = [];
        this.selectedDisplays.forEach(d => displays.push(d)); // add all the selected displays
        this.defaultPreset.displays.forEach(d => displays.push(d)); // add all of my default displays

        let audioDevices = this.defaultPreset.audioDevices.slice(); // copy my default audioDevices
        let audioConfigs = this.data.getAudioConfigurations(this.selectedDisplays);
        let hasRoomWide = this.data.hasRoomWide(audioConfigs);

        // if there is a display selected whoose audioConfig is tied to a roomWideAudio,
        // then set audioDevices = the selected roomWideAudios.
        if (hasRoomWide) {
            audioDevices.length = 0;

            for (let config of audioConfigs) {
                if (config.roomWide) 
                    audioDevices.push(...config.audioDevices);
            }
        }
        
        // take the displays & audioDevices generated above, copy the defaultPresets shareableDisplays, inputs, and independentAudioDevices, and create a new preset
        this.sharePreset = new Preset("Sharing", "subscriptions", displays, audioDevices, this.defaultPreset.inputs, this.defaultPreset.shareableDisplays, this.defaultPreset.independentAudioDevices);
        console.log("sharePreset", this.sharePreset);

        this.wheel.share(this.selectedDisplays).subscribe(
            success => {
                if (success) {
                    this.changePreset(this.sharePreset);

                    let names: string[] = []; 
                    this.selectedDisplays.forEach(d => {
                        names.push(d.name);

                        /* TODO does this need to be in? 
                        let event = new Event(0,0, " ", d.name, SHARING, "remove")
                        this.api.sendFeatureEvent(event);
                       */
                    });

                    let displays: string = names.join(",");

                        let event = new Event(0, 0, this.defaultPreset.name, displays, SHARE, " ");
//                    let event: Event = new Event(0, 0, APIService.hostname, device, SHARE, "true");
                    this.api.sendFeatureEvent(event);

                    ret.emit(true);
                } else {
                    this.changePreset(this.defaultPreset);
                    ret.emit(false);
                } 
            }
        );

        return ret;
    }

    public unShare(): EventEmitter<boolean> {
        swal.showLoading();
        let ret: EventEmitter<boolean> = new EventEmitter();

        // filter out my defaultPreset's displays, so that my displays aren't changed
        this.sharePreset.displays = this.sharePreset.displays.filter(d => !this.defaultPreset.displays.includes(d));
        
        this.wheel.unShare(this.sharePreset.displays).subscribe(
            success => {
                if (success) {
                    let names: string[] = []; 
                    this.selectedDisplays.forEach(d => names.push(d.name));
                    let device: string = names.join(",");
                    
                    let event = new Event(0,0, "requestor", device, STOP_SHARE, " ");
//                    let event: Event = new Event(0, 0, APIService.hostname, device, SHARE, "false");
                    this.api.sendFeatureEvent(event);

                    this.changePreset(this.defaultPreset);

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

    /*
     * Tell the minion to mirror a specific preset.
     */
    public mirror(preset: Preset) {
        this.wheel.command.mirror(preset, this.wheel.preset).subscribe(
            success => {
                if (success) {
                    let names: string[] = [];
                    this.wheel.preset.displays.forEach(d => names.push(d.name));
                    let displays: string = names.join(",");

                    let event = new Event(0, 0, preset.name, displays, JOIN_SHARE, " ");
                    this.api.sendFeatureEvent(event);
                }
            }
        );
    }

    public unMirror() {
        let names: string[] = [];
        this.wheel.preset.displays.forEach(d => names.push(d.name));
        let displays: string = names.join(",");

        let event = new Event(0, 0, /*TODO */this.mirrorPresetName, displays, LEAVE_SHARE, " ");
        this.api.sendFeatureEvent(event);

        // switch the input back to default
        this.wheel.command.powerOnDefault(this.defaultPreset);
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

                        break;
                    }
                    case INPUT: {
                        if (APIService.piHostname === ew.hostname || e.eventCause !== 0) {
                            break;
                        }

                        if (this.defaultPreset.displays.find(d => d.name === e.device) == null) {
                            break;
                        }

                        let input = Input.getInput(e.eventInfoValue, this.data.inputs);

                        if (input !== null && !this.defaultPreset.inputs.includes(input)) {
                            console.log("Creating a new input on the wheel from event:", e);

                            input.displayname = "Station " + this.numberFromHostname(ew.hostname);
                            input.click.subscribe(() => {
                                let panel = this.data.panels.find(p => p.hostname === ew.hostname);

                                if (panel != null) {
                                    this.mirror(panel.preset);

//                                    this.mirrorNumber = this.numberFromHostname(ew.hostname);
                                    this.mirrorDialog.show();
                                } else {
                                    console.error("failed to find panel with hostname", ew.hostname, ". panels: ", this.data.panels);
                                }
                            });

                            this.defaultPreset.extraInputs.length = 0;
                            this.defaultPreset.extraInputs.push(input); 

                            setTimeout(() => this.wheel.render(), 0);
                        }

                        break; 
                    }
                    case SHARE: 
                        if (this.appliesToMe(e.device.split(","))) {
                            console.log(SHARE, "event that applies to me", e);
                            if (e.requestor == this.defaultPreset.name) {
                                // someone who's panel i'm supposed to mirror just shared.
                                // i should look like i'm sharing too!
                                // e.device has the displays i should be sharing to.
                            } else {
                                // someone shared to me. i should look like a minion.
                            }
                        }

                        break;
                    case STOP_SHARE: 
                        if (this.appliesToMe(e.device.split(","))) {
                            if (e.requestor == this.defaultPreset.name) {
                                // someone who's panel i'm supposed to mirror just unshared.
                                // i should switch back to my default preset.
                            } else {
                                // someone stopped sharing to me.
                            }
                        }
                        break;
                    case LEAVE_SHARE: 
                        if (e.requestor == this.defaultPreset.name) {
                            // someone wants to leave the group i created
                        }
                        break;
                    /*
                    case SHARE: {
                        console.log("share event", e);

                        // Device field on DTA determines what devices got changed. If one of mine did, then show the popup.
                        let names: string[] = e.device.split(",");

                        let showPopup: boolean = false;
                        this.wheel.preset.displays.forEach(d => {
                            if (names.includes(d.name))
                                showPopup = true;
                        });

                        if (showPopup) {
                            if (e.eventInfoValue === "true" && e.requestor !== APIService.piHostname) {

                                if (this.wheel.preset == this.sharePreset) {
                                    let minions: string[] = [];
                                    this.selectedDisplays.forEach(d => {
                                        if (!this.defaultPreset.displays.includes(d))
                                            minions.push(d.name);
                                    });
                                    let device: string = minions.join(",");

//                                    let event = new Event(0, 0, " ", device, MIRROR, e.requestor);
                                    this.api.sendFeatureEvent(event);

                                    event = new Event(0, 0, e.requestor, device, SHARE, "true");
                                    this.api.sendFeatureEvent(event);

                                    this.wheel.preset = this.defaultPreset;
                                    setTimeout(() => this.wheel.render(), 0);
                                }

//                                this.mirrorNumber = this.numberFromHostname(e.requestor);
                                this.mirrorDialog.show();
                            } else {
//                                if (this.mirrorNumber === this.numberFromHostname(e.requestor)) {
//                                    this.removeExtraInputs();
//                                    swal.close();
//                                }
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

                        break;
                    }
                    case SHARING: {
                        console.log("sharing event", e);
                        if (this.sharePreset == this.wheel.preset) {
                            // TODO edit sharePreset.audioDevices based on add/remove events
                            //      if a roomWideAudio is added, send a request to change audio over there.
                            //      if a roomWideAudio is removed, send a request to change audio back to the me (the master)
                            let names = e.device.split(","); 

                            // remove the name if it's on my default preset (those ones should never be added/removed - at least for now)
                            names = names.filter(n => !this.defaultPreset.displays.some(d => d.name === n));

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
                                    this.sharePreset.audioDevices = this.defaultPreset.audioDevices;
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
                                    this.wheel.command.setVolume(0, this.sharePreset.audioDevices).subscribe(() => {
                                        // change the audioDevices
                                        this.sharePreset.audioDevices.length = 0;

                                        for (let config of audioConfigs) {
                                            if (config.roomWide) 
                                                this.sharePreset.audioDevices.push(...config.audioDevices);
                                        }
                                        console.log("share preset audio devices changed to: ", this.sharePreset);

                                        this.wheel.command.setVolume(30, this.sharePreset.audioDevices);
                                        this.wheel.command.setMute(false, this.sharePreset.audioDevices);
                                    });
                                } else
                                    console.log("no room wide audioDevice was added");

                                console.log("added", displays, "to mirror list. now mirroring to", this.wheel.preset.displays);
                            }
                        } 

                        break;
                    }
                   */
                    case POWER_OFF_ALL: 
                        this.removeExtraInputs();
                        swal.close();

                        if (this.sharePreset == this.wheel.preset) {
                            this.unShare().subscribe(success => {
                                if (success)
                                    this.wheel.command.powerOffAll();
                            });
                        }

                        break;
                }
            }
        }); 
    }

    private appliesToMe(listOfDisplayNames: string[]): boolean {
        for (let d of this.defaultPreset.displays) {
            if (listOfDisplayNames.includes(d.name)) {
                return true;
            }
        }
        return false;
    }

    private numberFromHostname(requestor: string): string {
        let num = requestor.split("-")[2][2];
        return num; 
    }

    private removeExtraInputs() {
        this.wheel.preset.extraInputs.length = 0; 
        setTimeout(() => this.wheel.render(), 0);
    }

    private changePreset(newPreset: Preset) {
        this.wheel.preset = newPreset;
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

    public showAudioControl(from: SwalComponent) {
        this.audioDialog.show().then(result => {
            from.show();
        });
    }
}
