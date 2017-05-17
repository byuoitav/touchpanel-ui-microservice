export class Room {
	config: RoomConfiguration;
	status: RoomStatus;
}

export class RoomConfiguration {
	id: number;
	name: string;
	description: string;
	devices: Device[];
	configurationID: number;
	roomDesignation: string;
}

export class RoomStatus {
	building: string;
	room: string;
	displays: StatusDevice[];
	audioDevices: StatusDevice[];
}

export class StatusDevice {
	name: string;
	power: string;
	input: string;
	blanked: boolean;
	muted: boolean;
	volume: number;
}

export class Device {
	id: number;
	name: string;
	display_name: string;
	address: string;
	input: boolean;
	output: boolean;
	type: string;
	roles: string[];
	responding: boolean;
	currInput: string;
}

export class Event {
	type: number;
	eventCause: number;
	device: string;
	eventInfoKey: string;
	eventInfoValue: string;	
}

export class DisplayInputMap {
	name: string;
	displayName: string;
	input: string;
	type: string;
}
