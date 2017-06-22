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

export class icons {
  static readonly blanked = "panorama_wide_angle";
  static readonly hdmi = "settings_input_hdmi";
  static readonly overflow = "people";
  static readonly computer = "computer";
  static readonly iptv = "";
  static readonly appletv = "airplay";
  static readonly generic = "generic";
  static readonly table = "byu_table_input";
}

export class cookies {
  static readonly inputs = "inputsToShow";
  static readonly displays = "displaysToShow";
}
