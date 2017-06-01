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
//  type: string;
  selected: boolean;
  icon: string;
  blanked: boolean;
}
