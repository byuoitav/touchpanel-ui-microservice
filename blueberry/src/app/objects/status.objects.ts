import { Type } from 'serializer.ts/Decorators';
import { EventEmitter } from '@angular/core';
import { SpringboardItem } from '../components/springboard.component';

export const POWER: string = "power";
export const INPUT: string = "input";
export const BLANKED: string = "blanked";
export const MUTED: string = "muted";
export const VOLUME: string = "volume";
export const DTA: string = "dta";
export const SHARING: string = "sharing";

export class Device {
	name: string;
	displayname: string;

    constructor(name: string, displayname: string) {
        this.name = name;
        this.displayname = displayname;
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

}

export class Input extends Device implements SpringboardItem {
	icon: string;

    constructor(name: string, displayname: string, icon: string) {
        super(name, displayname);
        this.icon = icon;
    }

    public static getInput(name: string, inputs: Input[]): Input {
        return inputs.find(i => i.name == name);
    }

    public getColor(): string {
        return "red";  
    }

    public getIcon(): string {
        return this.icon; 
    }
}

export class Output extends Device {
    power: string;
    input: Input;

    powerEmitter: EventEmitter<string>;

    constructor(name: string, displayname: string, power: string, input: Input) {
        super(name, displayname); 
        this.power = power;
        this.input = input;

        this.powerEmitter = new EventEmitter();
    }

    public static getPower(outputs: Output[]): string {
        for (let o of outputs) {
            if (o.power == 'on') {
                return o.power;
            }
        }

        return 'standby'; 
    }

    public static getInput(outputs: Output[]): Input {
        let input: Input = null;

        for (let o of outputs) {
            if (input == null) {
                input = o.input;
            } else if (o.input != input) {
                return null;
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

    constructor(name: string, displayname: string, power: string, input: Input, blanked: boolean) {
        super(name, displayname, power, input);
        this.blanked = blanked;
    }

    // returns true iff both are blanked
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
}

export class AudioDevice extends Output {
	muted: boolean;
	volume: number;
    roomWideAudio: boolean;

    constructor(name: string, displayname: string, power: string, input: Input, muted: boolean, volume: number, roomWideAudio: boolean) {
        super(name, displayname, power, input);
        this.muted = muted;
        this.volume = volume;
        this.roomWideAudio = roomWideAudio;
    }

    // return average of all volumes
    public static getVolume(audioDevices: AudioDevice[]): number {
        let volume: number = 0;

        audioDevices.forEach(a => volume += a.volume);

        return volume / audioDevices.length;
    }

    // returns true iff both are muted
    public static getMute(audioDevices: AudioDevice[]): boolean {
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
