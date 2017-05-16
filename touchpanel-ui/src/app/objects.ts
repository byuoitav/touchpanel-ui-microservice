export class Room {
	videoInDevices: []Device;
	videoOutDevices: []Device;	
	audioInDevices: []Device;
	audioOutDevices: []Device;
}

export class Device {
	name: string;
	displayName: string;
	input: boolean;
	output: boolean;
	input?: string;
}
