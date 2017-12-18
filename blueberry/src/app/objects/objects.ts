import { Type } from 'serializer.ts/Decorators';
import { Device, Display, AudioDevice, Input } from './status.objects';

export class Room {
	config: RoomConfiguration;
	status: RoomStatus;
    uiconfig: UIConfiguration;
}

export class RoomConfiguration {
	id: number;
	name: string;
	description: string;

	@Type(() => DeviceConfiguration)
	devices: DeviceConfiguration[];

	match(n: string) {
		return n == this.name;	
	}
}

export class RoomStatus {
	@Type(() => DeviceStatus)
	displays: DeviceStatus[];

	@Type(() => DeviceStatus)
	audioDevices: DeviceStatus[];
}

export class UIConfiguration {
    @Type(() => PanelConfiguration)
    panels: PanelConfiguration[];

    @Type(() => PresetConfiguration)
    presets: PresetConfiguration[];

    @Type(() => InputConfiguration)
    inputConfiguration: InputConfiguration[];

    Api: string[];
    roomWideAudios: string[];
}

export class PanelConfiguration {
    hostname: string;
    uipath: string;
    features: string[];
    preset: string;
    independentAudioDevices: string[];
}

export class PresetConfiguration {
    name: string;
    icon: string;
    displays: string[];
    shareableDisplays: string[];
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

export class DeviceConfiguration {
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

export class Preset {
    name: string;
    icon: string;

    displays: Display[] = [];
    audioDevices: AudioDevice[] = [];
    inputs: Input[] = [];
    extraInputs: Input[] = [];

    shareableDisplays: string[];

    constructor(name: string, icon: string, displays: Display[], audioDevices: AudioDevice[], inputs: Input[], shareableDisplays: string[]) {
        this.name = name;
        this.icon = icon;
        this.displays = displays;
        this.audioDevices = audioDevices;
        this.inputs = inputs;
        this.shareableDisplays = shareableDisplays;
    }
}

export class Panel {
    hostname: string;
    uipath: string;
    preset: Preset;
    features: string[] = [];
    independentAudioDevices: AudioDevice[] = [];

    render: boolean = false;

    constructor(hostname: string, uipath: string, preset: Preset, features: string[], independentAudioDevices: AudioDevice[]) {
        this.hostname = hostname;
        this.uipath = uipath;
        this.preset = preset;
        this.features = features;
        this.independentAudioDevices = independentAudioDevices;
    }
}
