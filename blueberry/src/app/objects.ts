import { Type } from 'serializer.ts/Decorators';

export class Room {
	config: RoomConfiguration;
	status: RoomStatus;
    uiconfig: UIConfiguration;
}

export class RoomConfiguration {
	id: number;
	name: string;
	description: string;

	@Type(() => Device)
	devices: Device[];

	match(n: string) {
		return n == this.name;	
	}

//	configurationID: number;
//	configuration: Configuration;
//	roomDesignation: string;
}

export class RoomStatus {
	@Type(() => DeviceStatus)
	displays: DeviceStatus[];

	@Type(() => DeviceStatus)
	audioDevices: DeviceStatus[];
}

export class UIConfiguration {
    @Type(() => Panel)
    panels: Panel[];

    @Type(() => PresetConfiguration)
    presets: PresetConfiguration[];

    @Type(() => InputConfiguration)
    inputConfiguration: InputConfiguration[];

    Api: string[];
}

export class Panel {
    hostname: string;
    uipath: string;
    presets: string[];
    features: string[];
    independentAudioDevices: string[];
}

export class PresetConfiguration {
    name: string;
    icon: string;
    displays: string[];
    audioDevices: string[];
    inputs: string[];
}

export class InputConfiguration {
    name: string;
    icon: string;
}

export class DeviceStatus {
	name: string;
	power: string;
	input: string;
	blanked: boolean;
	muted: boolean;
	volume: number;

	match(n: string) {
		return n == this.name;	
	}
}

export class Device {
	id: number;
	name: string;
	display_name: string;
	address: string;
	input: boolean;
	output: boolean;
	type: string;
	roles: string;

	public hasRole(role: string): boolean {
		for (let r of this.roles) {
			if (r == role) {
				return true;
			}
		}
		return false;
	}
}

export class Event {
	type: number;
	eventCause: number;
	requestor: string;
	device: string;
	eventInfoKey: string;
	eventInfoValue: string;
}

export class Preset {
    name: string;
    icon: string;

    displays: Display[] = [];
    audioDevices: AudioDevice[] = [];
    inputs: Input[] = [];

    top: string;
    right: string;
}

export class StatusDevice {
	name: string;
	displayname: string;

    constructor(name: string, displayname: string) {
        this.name = name;
        this.displayname = displayname;
    }
}

export class Display extends StatusDevice {
	power: string;
	input: Input;
	blanked: boolean;

    constructor(name: string, displayname: string, power: string, input: Input, blanked: boolean) {
        super(name, displayname);
        this.power = power;
        this.input = input;
        this.blanked = blanked;
    }
}

export class AudioDevice extends StatusDevice {
	power: string;
	input: Input;
	muted: boolean;
	volume: number;

    constructor(name: string, displayname: string, power: string, input: Input, muted: boolean, volume: number) {
        super(name, displayname);
        this.power = power;
        this.input = input;
        this.muted = muted;
        this.volume = volume;
    }
}

export class Input extends StatusDevice {
	icon: string;

    constructor(name: string, displayname: string, icon: string) {
        super(name, displayname);
        this.icon = icon;
    }
}

