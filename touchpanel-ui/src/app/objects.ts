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
	id: number;
	name: string;
	displayName: string;
	address: string;
	input: boolean;
	output: boolean;
	type: string;
	roles: string[];
	responding: boolean;
}

export class Event {
	type: number;
	eventCause: number;
	device: string;
	eventInfoKey: string;
	eventInfoValue: string;	
}
