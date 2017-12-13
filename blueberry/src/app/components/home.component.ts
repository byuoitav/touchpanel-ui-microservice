import { Component, ViewChild,  EventEmitter, Output as AngularOutput, OnInit } from '@angular/core';
import { deserialize } from 'serializer.ts/Serializer';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { SwalComponent, SwalPartialTargets } from '@toverux/ngx-sweetalert2';

import { WheelComponent } from './wheel.component';
import { DataService } from '../services/data.service';
import { APIService } from '../services/api.service';
import { GraphService } from '../services/graph.service';
import { SocketService, MESSAGE, Event } from '../services/socket.service';
import { HelpDialog } from '../dialogs/help.dialog';
import { ChangedDialog } from '../dialogs/changed.dialog';

import { Preset } from '../objects/objects';
import { Output, Display, AudioDevice, INPUT, Input, DTA, POWER } from '../objects/status.objects';

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

    @ViewChild("poweroffall") powerOffAllDialog: SwalComponent;
    @ViewChild("help") helpDialog: SwalComponent;
    @ViewChild("helpConfirm") helpConfirmDialog: SwalComponent;
    @ViewChild("selectdisplays") selectDisplaysDialog: SwalComponent;
    @ViewChild("unshare") unShareDialog: SwalComponent;
    @ViewChild("changed") changedDialog: SwalComponent;

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
                            if (success) 
                                resolve();
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

        this.changedDialog.options = {
            title: "Input Changed",
            type: "info",
            focusConfirm: false,
            confirmButtonText: "Dismiss",
        };

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

        this.wheel.preset.shareableDisplays.forEach(name => {
            let display = this.data.displays.find(d => d.name === name);
            this.shareableDisplays.push(display);
        });

        // check all displays
        this.shareableDisplays.forEach(name => {
            this.selectedDisplays.push(name);
        });
    }

    public share(): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter();

        this.removeExtraInputs();

        // get audioDevices from selected displays
        let audioDevices: AudioDevice[] = [];
        for (let d of this.selectedDisplays) {
            let a = this.data.audioDevices.find(a => a.name == d.name);
            if (a != null) {
                audioDevices.push(a);
            }
        }

        let displays: Display[] = [];
        this.selectedDisplays.forEach(d => displays.push(d));
        this.wheel.preset.displays.forEach(d => displays.push(d));

        this.sharePreset = new Preset("Sharing", "subscriptions", displays, this.wheel.preset.audioDevices, this.wheel.preset.inputs, this.wheel.preset.shareableDisplays);
        console.log("sharePreset", this.sharePreset);

        this.wheel.share(this.selectedDisplays, audioDevices).subscribe(
            success => {
                if (success) {
                    this.wheel.preset = this.sharePreset;
                    ret.emit(true);
                } else {
                    this.wheel.preset = this.preset;
                    ret.emit(false);
                } 
            }
        );

        return ret;
    }

    public unShare(): EventEmitter<boolean> {
        swal.showLoading();
        let ret: EventEmitter<boolean> = new EventEmitter();

        let audioDevices: AudioDevice[] = [];
        for (let d of this.selectedDisplays) {
            let a = this.data.audioDevices.find(a => a.name == d.name);
            if (a != null) {
                audioDevices.push(a);
            }
        }
        
        this.wheel.unShare(this.selectedDisplays, audioDevices).subscribe(
            success => {
                if (success) {
                    this.swalStatus(true);

                    this.wheel.preset = this.preset;
                    ret.emit(true);
                } else {
                    this.swalStatus(false);
                    ret.emit(false);
                }
            }
        );

        return ret;
    }

    private updateFromEvents() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let e: Event = event.data;

                switch(e.eventInfoKey) {
                    case POWER: {
                        if (e.eventInfoValue == "standby" && this.wheel.preset.displays.find(d => d.name === e.device) != null) {
                            this.removeExtraInputs();
                        }
                    }
                    case INPUT: {
                        if (this.wheel.preset.displays.find(d => d.name === e.device) == null) {
                            break;
                        }

                        let input = Input.getInput(e.eventInfoValue, this.data.inputs);

                        // its a valid input, it's not on your wheel
                        if (input != null && !this.wheel.preset.inputs.includes(input)) {

                            // if the input gets changed on a device that is yours, and you're in display to all mode
                            if (this.preset.displays.find(d => d.name === e.device) != null && this.wheel.preset == this.sharePreset) {
                                console.info("no longer display to all master")
                                this.wheel.preset = this.preset;
                            } 

                            if (this.wheel.preset != this.sharePreset) {
                                console.log("Creating a new input on the wheel from event:", e);
                                this.wheel.preset.extraInputs.length = 0;
                                this.wheel.preset.extraInputs.push(input); 
                                setTimeout(() => this.wheel.render(), 0);
                            }
                        }
                        break; 
                    } 
                    case DTA: {
                        console.log("DTA Event:", e);
                        if (e.eventInfoValue === "true" && e.requestor !== APIService.piHostname) {
                            this.changedDialog.options.html = "<span>Station " + this.numberFromHostname(e.requestor) + " has shared an input with you.";
                        } else {
                            this.removeExtraInputs();

                            this.changedDialog.options.timer = 6000;
                            this.changedDialog.options.html = "<span>Station " + this.numberFromHostname(e.requestor) + " is no longer sharing an input with you";
                        }

                        this.changedDialog.show();
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
