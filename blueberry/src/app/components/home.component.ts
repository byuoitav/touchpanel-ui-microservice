import { Component, ViewChild,  EventEmitter, Output as AngularOutput, OnInit } from '@angular/core';
import { deserialize } from 'serializer.ts/Serializer';
import swal, { SweetAlertOptions } from 'sweetalert2';
import { SwalComponent, SwalPartialTargets } from '@toverux/ngx-sweetalert2';

import { WheelComponent } from './wheel.component';
import { DataService } from '../services/data.service';
import { APIService } from '../services/api.service';
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

    dtaPreset: Preset;
    oldPreset: Preset;

    selectedDisplays: Display[] = [];
   
    @ViewChild("poweroffall") powerOffAllDialog: SwalComponent;
    @ViewChild("help") helpDialog: SwalComponent;
    @ViewChild("helpConfirm") helpConfirmDialog: SwalComponent;
    @ViewChild("selectdisplays") selectDisplaysDialog: SwalComponent;

    @ViewChild("displaytoall") dtaDialog: SwalComponent;
    @ViewChild("undisplaytoall") unDtaDialog: SwalComponent;

    @ViewChild("changed") changedDialog: SwalComponent;

    constructor(public data: DataService, private socket: SocketService, public api: APIService, public readonly swalTargets: SwalPartialTargets) {
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

        this.dtaDialog.options = {
            title: "Displaying to all...",
            allowOutsideClick: false
        }

        this.unDtaDialog.options = {
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
            preConfirm: () => {
                return new Promise((resolve, reject) => {
                    this.displayToAll().subscribe(success => {
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
        this.wheel.preset.top = "50vh";
        this.wheel.preset.right = "50vw";

        this.oldPreset = this.wheel.preset;

        this.dtaPreset = new Preset("All Displays", "subscriptions", this.data.displays, this.data.audioDevices.filter(a => a.roomWideAudio), this.wheel.preset.inputs);
        this.dtaPreset.top = this.wheel.preset.top;
        this.dtaPreset.right = this.wheel.preset.right;

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
        if (this.wheel.preset === this.dtaPreset) {
            this.unDisplayToAll().subscribe(success => {
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

    public displayToAll(): EventEmitter<boolean> {
        this.removeExtraInputs();
        let ret: EventEmitter<boolean> = new EventEmitter();

        let input: Input = Display.getInput(this.wheel.preset.displays);
        if (input == null) {
            ret.emit(false);
            return ret;
        }

        // change to a preset with the displays selected in it
        this.wheel.preset = this.dtaPreset;

        this.wheel.displayToAll(input, this.data.displays, this.data.audioDevices).subscribe(
            success => {
                if (success) {
                    ret.emit(true);
                } else {
                    this.wheel.preset = this.oldPreset;

                    ret.emit(false);
                } 
            }
        );

        return ret;
    }

    public unDisplayToAll(): EventEmitter<boolean> {
        this.unDtaDialog.show();
        swal.showLoading();

        let ret: EventEmitter<boolean> = new EventEmitter();

        this.wheel.preset = this.oldPreset;
        this.wheel.unDisplayToAll(this.data.presets).subscribe(
            success => {
                if (success) {
                    this.swalStatus(true);
                    ret.emit(true);
                } else {
                    this.wheel.preset = this.dtaPreset;

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
                            if (this.oldPreset.displays.find(d => d.name === e.device) != null && this.wheel.preset == this.dtaPreset) {
                                console.info("no longer display to all master")
                                this.wheel.preset = this.oldPreset;
                            } 

                            if (this.wheel.preset != this.dtaPreset) {
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
        if (this.selectedDisplays.includes(d)) {
            // remove from array
        } else {
            this.selectedDisplays.push(d);
        }
    }
}
