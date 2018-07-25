import { Type } from "serializer.ts/Decorators";
import { EventEmitter } from "@angular/core";
import { SpringboardItem } from "../components/springboard.component";
import { AudioConfiguration } from "./objects";
import { APIService } from "../services/api.service";

export const POWER: string = "power";
export const INPUT: string = "input";
export const BLANKED: string = "blanked";
export const MUTED: string = "muted";
export const VOLUME: string = "volume";
//export const SHARING: string = "sharing";
export const POWER_OFF_ALL: string = "power_off_all";
//export const MIRROR: string = "mirror";

export class Device {
  name: string;
  displayname: string;

  public static filterDevices<T extends Device>(
    names: string[],
    devices: T[]
  ): T[] {
    if (names == null || devices == null) {
      return [];
    }
    const ret: T[] = [];

    for (const name of names) {
      const dev = devices.find(d => d.name === name);
      if (dev != null) {
        ret.push(dev);
      }
    }

    return ret;
  }

  constructor(name: string, displayname: string) {
    this.name = name;
    this.displayname = displayname;
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
  click: EventEmitter<null> = new EventEmitter();
  reachableDisplays: string[] = [];

  public static getInput(name: string, inputs: Input[]): Input {
    return inputs.find(i => i.name === name);
  }

  constructor(
    name: string,
    displayname: string,
    icon: string,
    reachableDisplays: string[]
  ) {
    super(name, displayname);
    this.icon = icon;
    this.reachableDisplays = reachableDisplays;
  }

  public isDisplayReachable(name: string): boolean {
    return this.reachableDisplays.includes(name);
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
      if (o.power == "on") {
        return o.power;
      }
    }

    return "standby";
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
    outputs.forEach(o => (o.power = s));
  }

  public static setInput(i: Input, outputs: Output[]) {
    outputs.forEach(o => (o.input = i));
  }
}

export class Display extends Output {
  blanked: boolean;

  constructor(
    name: string,
    displayname: string,
    power: string,
    input: Input,
    blanked: boolean
  ) {
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
    displays.forEach(d => (d.blanked = b));
  }

  public getAudioConfiguration(): AudioConfiguration {
    return APIService.room.uiconfig.audioConfiguration.find(
      a => a.display === this.name
    );
  }

  public static getDisplayListFromNames(
    names: string[],
    displaysSource: Display[]
  ): Display[] {
    return displaysSource.filter(d => names.includes(d.name));
  }
}

export class AudioDevice extends Output {
  muted: boolean;
  volume: number;

  constructor(
    name: string,
    displayname: string,
    power: string,
    input: Input,
    muted: boolean,
    volume: number
  ) {
    super(name, displayname, power, input);
    this.muted = muted;
    this.volume = volume;
  }

  // return average of all volumes
  public static getVolume(audioDevices: AudioDevice[]): number {
    let volume: number = 0;

    audioDevices.forEach(a => (volume += a.volume));

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
    audioDevices.forEach(a => (a.volume = v));
  }

  public static setMute(m: boolean, audioDevices: AudioDevice[]) {
    audioDevices.forEach(a => (a.muted = m));
  }
}
