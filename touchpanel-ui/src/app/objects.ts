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
  configuration: Configuration;
  roomDesignation: string;
}

export class RoomStatus {
  building: string;
  room: string;
  displays: DeviceStatus[];
  audioDevices: DeviceStatus[];
}

export class DeviceStatus {
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
  currInput: string;
}

export class Configuration {
  id: number;
  name: string;
  roomKey: string;
  description: string;
  roomInitKey: string;
}

export class Event {
  type: number;
  eventCause: number;
  requestor: string;
  device: string;
  eventInfoKey: string;
  eventInfoValue: string;
}

export class DeviceData {
  name: string;
  displayName: string;
  input: string;
  selected: boolean;
  icon: string;
  blanked: boolean;
}

export class UIConfiguration {
	inputdevices: InputDevice[];
	displays: OutputDevice[];
	features: string[];
	audio: AudioConfig[]; 
	ui: string;
}

export class AudioConfig {
	displays: string;
	audiodevices: string;
}

export class OutputDevice {
	selected: boolean;

	name: string;
	displayname: string;
	icon: string;
	blanked: boolean;

	oinputs: InputDevice[];
	odefaultinput: InputDevice;
	oinput: InputDevice;
	DTADevice: DTADevice;

	oaudiodevices: AudioOutDevice[];

	// don't use these:) these just come from the uiconfig object and get
	// converted into the above objects
	input: string;
	defaultinput: string;
	inputs: string[];
	audiodevices: string[];
	defaultaudio: string;
}

export class InputDevice {
	name: string;
	displayname: string;
	icon: string;
}

export class DTADevice {
	name: string;
	displayname: string;
	icon: string;
	hostname: string;
}

export class AudioOutDevice {
	selected: boolean;	

	name: string;
	power: string;
	input: string;
	volume: number;
	muted: boolean;
}

export class Mic {
	name: string;
	displayname: string;
	volume: number;
	muted: boolean;
}

export class icons {
  static readonly blanked = "panorama_wide_angle";
  static readonly hdmi = "settings_input_hdmi";
  static readonly overflow = "people";
  static readonly computer = "computer";
  static readonly iptv = "";
  static readonly appletv = "airplay";
  static readonly generic = "generic";
  static readonly table = "byu_table_input";
  static readonly tv = "tv";
  static readonly projector = "videocam";
  static readonly bluray = "album";
}

export class cookies {
  static readonly inputs = "inputsToShow";
  static readonly displays = "displaysToShow";
  static readonly dta = "displayToAll";
}
