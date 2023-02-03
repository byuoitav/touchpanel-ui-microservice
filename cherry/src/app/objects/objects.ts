import {Type} from "serializer.ts/Decorators";
import {Device, Display, AudioDevice, Input} from "./status.objects";

export class Room {
  config: RoomConfiguration;
  status: RoomStatus;
  uiconfig: UIConfiguration;
}

// not the same as an actual room configuration lol
export class RoomConfiguration {
  _id: string;
  name: string;
  description: string;

  @Type(() => DeviceConfiguration)
  devices: DeviceConfiguration[];

  input_reachability: Map<string, string[]> = new Map();

  match(n: string) {
    return n === this.name;
  }
}

export class DeviceConfiguration {
  _id: string;
  name: string;
  display_name: string;
  address: string;

  @Type(() => DeviceTypeConfiguration)
  type: DeviceTypeConfiguration;

  @Type(() => RoleConfiguration)
  roles: RoleConfiguration[];

  public hasRole(role: string): boolean {
    for (const r of this.roles) {
      if (r._id === role) {
        return true;
      }
    }
    return false;
  }
}

export class DeviceTypeConfiguration {
  _id: string;
  description: string;
  tags: string[];
}

export class RoleConfiguration {
  _id: string;
  description: string;
  tags: string[];
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

  @Type(() => PseudoInput)
  pseudoInputs: PseudoInput[];

  Api: string[];
}

export class Camera {
  displayName: string;

  tiltUp: string;
  tiltDown: string;
  panLeft: string;
  panRight: string;
  panTiltStop: string;

  zoomIn: string;
  zoomOut: string;
  zoomStop: string;

  memoryRecall: string;

  presets: CameraPreset[];
}

export class CameraPreset {
  displayName: string;
  setPreset: string;
}

export class Recording {
  start: string;
  stop: string;
  maxTime: number; // max recording time in minutes
}

export class ConfigCommands {
  powerOn: ConfigCommand[];
  powerOff: ConfigCommand[];
  inputSame: ConfigCommand[];
  inputDifferent: ConfigCommand[];
}

export class ConfigCommand {
  method: string;
  port: number;
  endpoint: string;
  body: Object;
  delay: number;
}

export class PseudoInput {
  displayname: string;
  config: PseudoInputConfig[];
}

export class PseudoInputConfig {
  input: string;
  outputs: string[];
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
  volumeMatches: string[];
  audioGroups: Map<string, string[]> = new Map();
  commands: ConfigCommands;
  cameras: Camera[];
  recording: Recording;
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

  constructor(
    display: Display,
    audioDevices: AudioDevice[],
    roomWide: boolean
  ) {
    this.display = display;
    this.audioDevices = audioDevices;
    this.roomWide = roomWide;
  }
}

export class IOConfiguration {
  name: string;
  icon: string;
  displayname: string;
  subInputs: IOConfiguration[];
}

export class DeviceStatus {
  name: string;
  power: string;
  input: string;
  blanked: boolean;
  muted: boolean;
  volume: number;

  match(n: string) {
    return n === this.name;
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

  volumeMatches: string[];

  audioTypes: Map<string, AudioDevice[]> = new Map();

  masterVolume: number;
  masterMute: boolean;
  beforeMuteLevel: number;

  commands: ConfigCommands;

  cameras: Camera[];

  recording: Recording;

  constructor(
    name: string,
    icon: string,
    displays: Display[],
    audioDevices: AudioDevice[],
    inputs: Input[],
    shareableDisplays: string[],
    independentAudioDevices: AudioDevice[],
    audioTypes: Map<string, AudioDevice[]>,
    masterVolume: number,
    beforeMuteLevel: number,
    commands: ConfigCommands,
    matches: string[],
    cameras: Camera[],
    recording: Recording
  ) {
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
    this.commands = commands;
    this.volumeMatches = matches;
    this.cameras = cameras;
    this.recording = recording;
  }
}

export class Panel {
  hostname: string;
  uipath: string;
  preset: Preset;
  features: string[] = [];

  render = false;

  constructor(
    hostname: string,
    uipath: string,
    preset: Preset,
    features: string[]
  ) {
    this.hostname = hostname;
    this.uipath = uipath;
    this.preset = preset;
    this.features = features;
  }
}
