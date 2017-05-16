export class Room {
	config: RoomConfiguration;
	status: RoomStatus;
}

export class RoomConfiguration {
	displays: Device[];
	audioDevices: Device[];
}

export class RoomStatus {
	currentVideoInput: string;
	currentAudioInput: string;
	power: string;
	blanked: boolean;
	muted: boolean;
	volume: number;
}

export class Device {
	name: string;
	displayName: string;
	power: string;
	input: boolean;
	blanked: boolean;
	muted: boolean;
	volume: number;
}

export class Event {
	type: number;
	eventCause: number;
	device: string;
	eventInfoKey: string;
	eventInfoValue: string;	
}
