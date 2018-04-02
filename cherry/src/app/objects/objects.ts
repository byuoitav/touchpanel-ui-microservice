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

    @Type(() => IOConfiguration)
    outputConfiguration: IOConfiguration[];

    @Type(() => IOConfiguration)
    inputConfiguration: IOConfiguration[];

    @Type(() => AudioConfiguration)
    audioConfiguration: AudioConfiguration[];

    Api: string[];
}

export class PanelConfiguration {
    hostname: string;
    uipath: string;
    features: string[];
    preset: string;
}

export class PresetConfiguration {
    name: string;
    icon: string;
    displays: string[];
    shareableDisplays: string[];
    audioDevices: string[];
    inputs: string[];
    independentAudioDevices: string[];
}

export class AudioConfiguration {
    display: string;
    audioDevices: string[];
    roomWide: boolean;
}

export class AudioConfig {
    display: Display;
    audioDevices: AudioDevice[];
    roomWide: boolean;

    constructor(display: Display, audioDevices: AudioDevice[], roomWide: boolean) {
        this.display = display;
        this.audioDevices = audioDevices;
        this.roomWide = roomWide;
    }
}

export class IOConfiguration {
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
    independentAudioDevices: AudioDevice[] = [];

    audioTypes: Map<string, AudioDevice[]> = new Map();

    masterVolume: number;
    beforeMuteLevel: number;

    constructor(name: string, icon: string, displays: Display[], audioDevices: AudioDevice[], inputs: Input[], shareableDisplays: string[], independentAudioDevices: AudioDevice[], audioTypes: Map<string, AudioDevice[]>, masterVolume: number, beforeMuteLevel: number) {
        this.name = name;
        this.icon = icon;
        this.displays = displays;
        this.audioDevices = audioDevices;
        this.inputs = inputs;
        this.shareableDisplays = shareableDisplays;
        this.independentAudioDevices = independentAudioDevices;
        this.audioTypes = audioTypes;
        this.masterVolume = masterVolume;
        this.beforeMuteLevel = beforeMuteLevel;
    }
}

export class Panel {
    hostname: string;
    uipath: string;
    preset: Preset;
    features: string[] = [];

    render: boolean = false;

    constructor(hostname: string, uipath: string, preset: Preset, features: string[]) {
        this.hostname = hostname;
        this.uipath = uipath;
        this.preset = preset;
        this.features = features;
    }
}
