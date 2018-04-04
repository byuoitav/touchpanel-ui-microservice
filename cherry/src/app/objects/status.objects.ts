import { Type } from 'serializer.ts/Decorators';
import { EventEmitter } from '@angular/core';
//import { SpringboardItem } from '../components/springboard.component';
import { AudioConfiguration } from './objects';
import { APIService } from '../services/api.service';

export const POWER: string = "power";
export const INPUT: string = "input";
export const BLANKED: string = "blanked";
export const MUTED: string = "muted";
export const VOLUME: string = "volume";
//export const POWER_OFF_ALL: string = "power_off_all";

export class Device {
	name: string;
	displayname: string;
    icon: string;

    constructor(name: string, displayname: string, icon: string) {
        this.name = name;
        this.displayname = displayname;
        this.icon = icon;
    }

    public static filterDevices<T extends Device>(names: string[], devices: T[]): T[] {
        if (names == null || devices == null) {
            return [];
        }
        let ret: T[] = []; 

        for (let name of names) {
            let dev = devices.find(d => d.name == name);
            if (dev != null) {
                ret.push(dev); 
            }
        }

        return ret;
    }

    public getName(): string {
        return this.name; 
    }

    public getDisplayName(): string {
        return this.displayname; 
    }

    public getIcon(): string {
        return this.icon; 
    }
}

export class Input extends Device {
    click: EventEmitter<null> = new EventEmitter();

    constructor(name: string, displayname: string, icon: string) {
        super(name, displayname, icon);
    }

    public static getInput(name: string, inputs: Input[]): Input {
        return inputs.find(i => i.name === name);
    }
}

export class Output extends Device {
    power: string;
    input: Input;

    powerEmitter: EventEmitter<string>;

    constructor(name: string, displayname: string, power: string, input: Input, icon: string) {
        super(name, displayname, icon); 
        this.power = power;
        this.input = input;

        this.powerEmitter = new EventEmitter();
    }

    public getInputIcon(): string {
        if (this.input == null)
            return this.icon;
        return this.input.icon;
    }

    public static getPower(outputs: Output[]): string {
        for (let o of outputs) {
            if (o.power == 'on')
                return o.power;
        }

        return 'standby';
    }

    public static isPoweredOn(outputs: Output[]): boolean {
        for (let o of outputs) {
            if (o.power != 'on') {
                return false;
            }
        }

        return true; 
    }

    public static getInput(outputs: Output[]): Input {
        let input: Input = null;

        for (let o of outputs) {
            if (input == null) {
                input = o.input;
            } else if (o.input != input) {
                // this means the input that appears selected may not actually be selected on all displays.
                // to get the ~correct~ behavior, return null.
                return o.input;
            }
        }

        return input; 
    }

    public static setPower(s: string, outputs: Output[]) {
        outputs.forEach(o => o.power = s); 
    }

    public static setInput(i: Input, outputs: Output[]) {
        outputs.forEach(o => o.input = i); 
    }
}

export class Display extends Output {
	blanked: boolean;

    constructor(name: string, displayname: string, power: string, input: Input, blanked: boolean, icon: string) {
        super(name, displayname, power, input, icon);
        this.blanked = blanked;
    }

    // returns true iff all are blanked
    public static getBlank(displays: Display[]): boolean {
        for (let d of displays) {
            if (!d.blanked) {
                return false;
            }
        }

        return true; 
    }

    public static setBlank(b: boolean, displays: Display[]) {
        displays.forEach(d => d.blanked = b); 
    }

    public getAudioConfiguration(): AudioConfiguration {
        return APIService.room.uiconfig.audioConfiguration.find(a => a.display === this.name);
    }

    public static getDisplayListFromNames(names: string[], displaysSource: Display[]): Display[] {
        return displaysSource.filter(d => names.includes(d.name));
    }
}

export class AudioDevice extends Output {
	muted: boolean;
	volume: number;
    type: string;

    mixlevel: number;

    constructor(name: string, displayname: string, power: string, input: Input, muted: boolean, volume: number, icon: string, type: string, mixlevel: number) {
        super(name, displayname, power, input, icon);
        this.muted = muted;
        this.volume = volume;
        this.type = type;
        this.mixlevel = mixlevel;
    }

    // return average of all volumes
    public static getVolume(audioDevices: AudioDevice[]): number {
        if (audioDevices == null)
            return 0;

        let volume: number = 0;

        audioDevices.forEach(a => volume += a.volume);

        return volume / audioDevices.length;
    }

    // returns true iff both are muted
    public static getMute(audioDevices: AudioDevice[]): boolean {
        if (audioDevices == null)
            return false;

        for (let a of audioDevices) {
            if (!a.muted) {
                return false;
            }
        }

        return true; 
    }

    public static setVolume(v: number, audioDevices: AudioDevice[]) {
        audioDevices.forEach(a => a.volume = v);
    }

    public static setMute(m: boolean, audioDevices: AudioDevice[]) {
        audioDevices.forEach(a => a.muted = m); 
    }
}
