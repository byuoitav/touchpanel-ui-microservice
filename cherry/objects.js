export class Room {
  constructor() {
    this.config = null;
    this.status = null;
    this.uiconfig = null;
  }
}

export class RoomConfiguration {
  constructor() {
    this._id = "";
    this.name = "";
    this.description = "";
    this.devices = [];
    this.input_reachability = new Map();
  }

  match(n) {
    return n === this.name;
  }
}

export class DeviceConfiguration {
  constructor() {
    this._id = "";
    this.name = "";
    this.display_name = "";
    this.address = "";
    this.type = null;
    this.roles = [];
  }

  hasRole(role) {
    for (const r of this.roles) {
      if (r._id === role) {
        return true;
      }
    }
    return false;
  }
}

export class DeviceTypeConfiguration {
  constructor() {
    this._id = "";
    this.description = "";
    this.tags = [];
  }
}

export class RoleConfiguration {
  constructor() {
    this._id = "";
    this.description = "";
    this.tags = [];
  }
}

export class RoomStatus {
  constructor() {
    this.displays = [];
    this.audioDevices = [];
  }
}

export class UIConfiguration {
  constructor() {
    this.panels = [];
    this.presets = [];
    this.outputConfiguration = [];
    this.inputConfiguration = [];
    this.audioConfiguration = [];
    this.pseudoInputs = [];
    this.Api = [];
  }
}

export class Camera {
  constructor() {
    this.displayName = "";

    this.tiltUp = "";
    this.tiltDown = "";
    this.panLeft = "";
    this.panRight = "";
    this.panTiltStop = "";

    this.zoomIn = "";
    this.zoomOut = "";
    this.zoomStop = "";

    this.memoryRecall = "";

    this.presets = [];
  }
}

export class CameraPreset {
  constructor() {
    this.displayName = "";
    this.setPreset = "";
  }
}

export class Recording {
  constructor() {
    this.start = "";
    this.stop = "";
    this.maxTime = 0;
  }
}

export class ConfigCommands {
  constructor() {
    this.powerOn = [];
    this.powerOff = [];
    this.inputSame = [];
    this.inputDifferent = [];
  }
}

export class ConfigCommand {
  constructor() {
    this.method = "";
    this.port = 0;
    this.endpoint = "";
    this.body = {};
    this.delay = 0;
  }
}

export class PseudoInput {
  constructor() {
    this.displayname = "";
    this.config = [];
  }
}

export class PseudoInputConfig {
  constructor() {
    this.input = "";
    this.outputs = [];
  }
}

export class PanelConfiguration {
  constructor() {
    this.hostname = "";
    this.uipath = "";
    this.features = [];
    this.preset = "";
  }
}

export class PresetConfiguration {
  constructor() {
    this.name = "";
    this.icon = "";
    this.displays = [];
    this.shareableDisplays = [];
    this.audioDevices = [];
    this.inputs = [];
    this.independentAudioDevices = [];
    this.volumeMatches = [];
    this.audioGroups = new Map();
    this.commands = new ConfigCommands();
    this.cameras = [];
    this.recording = new Recording();
  }
}

export class AudioConfiguration {
  constructor() {
    this.display = "";
    this.audioDevices = [];
    this.roomWide = false;
  }
}

export class AudioConfig {
  constructor(display, audioDevices, roomWide) {
    this.display = display;
    this.audioDevices = audioDevices;
    this.roomWide = roomWide;
  }
}

export class IOConfiguration {
  constructor() {
    this.name = "";
    this.icon = "";
    this.displayname = "";
    this.subInputs = [];
  }
}

export class DeviceStatus {
  constructor() {
    this.name = "";
    this.power = "";
    this.input = "";
    this.blanked = false;
    this.muted = false;
    this.volume = 0;
  }

  match(n) {
    return n === this.name;
  }
}

export class Preset {
  constructor(
    name,
    icon,
    displays,
    audioDevices,
    inputs,
    shareableDisplays,
    independentAudioDevices,
    audioTypes,
    masterVolume,
    beforeMuteLevel,
    commands,
    matches,
    cameras,
    recording
  ) {
    this.name = name;
    this.icon = icon;
    this.displays = displays || [];
    this.audioDevices = audioDevices || [];
    this.inputs = inputs || [];
    this.extraInputs = [];
    this.shareableDisplays = shareableDisplays || [];
    this.independentAudioDevices = independentAudioDevices || [];
    this.volumeMatches = matches || [];
    this.audioTypes = audioTypes || new Map();
    this.masterVolume = masterVolume || 0;
    this.beforeMuteLevel = beforeMuteLevel || 0;
    this.commands = commands || new ConfigCommands();
    this.cameras = cameras || [];
    this.recording = recording || new Recording();
    this.masterMute = false;
  }
}

export class Panel {
  constructor(hostname, uipath, preset, features) {
    this.hostname = hostname;
    this.uipath = uipath;
    this.preset = preset;
    this.features = features || [];
    this.render = false;
  }
}
