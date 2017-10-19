import { Type } from 'serializer.ts/Decorators';

export class Room {
	config: RoomConfiguration;
	status: RoomStatus;
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
	@Type(() => InputDevice)
	inputdevices: InputDevice[];

	@Type(() => DisplayConfig)
	displays: DisplayConfig[];
	features: string[];

	@Type(() => AudioConfig)
	audio: AudioConfig[];
	ui: string;
}

export class DisplayConfig {
	name: string;
	defaultinput: string;
	inputs: string[];
	icon: string;
}

export class AudioConfig {
	displays: string[];
	audiodevices: string[];
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

export class Display {
	names: string[] = [];
	displayname: string;
	icon: string;

	power: string;
	blanked: boolean;
	input: InputDevice;

	inputs: InputDevice[] = [];
	defaultinput: InputDevice;

	audioDevice: AudioOutDevice;

	// where it's positioned
	top: string;
	right: string;	
}

export class InputDevice {
	name: string;
	displayname: string;
	icon: string;
}

export class AudioOutDevice {
	names: string[] = [];	
	displayname: string;
	icon: string;

	muted: boolean;
	input: InputDevice;
	volume: number;
}
