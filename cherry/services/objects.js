class Room {
  constructor() {
    this.config = null;
    this.status = null;
    this.uiconfig = null;
  }
}

class RoomConfiguration {
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

class DeviceConfiguration {
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

class DeviceTypeConfiguration {
  constructor() {
    this._id = "";
    this.description = "";
    this.tags = [];
  }
}

class RoleConfiguration {
  constructor() {
    this._id = "";
    this.description = "";
    this.tags = [];
  }
}

class RoomStatus {
  constructor() {
    this.displays = [];
    this.audioDevices = [];
  }
}

class UIConfiguration {
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

class Camera {
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

class CameraPreset {
  constructor() {
    this.displayName = "";
    this.setPreset = "";
  }
}

class Recording {
  constructor() {
    this.start = "";
    this.stop = "";
    this.maxTime = 0;
  }
}

class ConfigCommands {
  constructor() {
    this.powerOn = [];
    this.powerOff = [];
    this.inputSame = [];
    this.inputDifferent = [];
  }
}

class ConfigCommand {
  constructor() {
    this.method = "";
    this.port = 0;
    this.endpoint = "";
    this.body = {};
    this.delay = 0;
  }
}

class PseudoInput {
  constructor() {
    this.displayname = "";
    this.config = [];
  }
}

class PseudoInputConfig {
  constructor() {
    this.input = "";
    this.outputs = [];
  }
}

class PanelConfiguration {
  constructor() {
    this.hostname = "";
    this.uipath = "";
    this.features = [];
    this.preset = "";
  }
}

class PresetConfiguration {
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

class AudioConfiguration {
  constructor() {
    this.display = "";
    this.audioDevices = [];
    this.roomWide = false;
  }
}

class AudioConfig {
  constructor(display, audioDevices, roomWide) {
    this.display = display;
    this.audioDevices = audioDevices;
    this.roomWide = roomWide;
  }
}

class IOConfiguration {
  constructor() {
    this.name = "";
    this.icon = "";
    this.displayname = "";
    this.subInputs = [];
  }
}

class DeviceStatus {
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

class Preset {
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

class Panel {
  constructor(hostname, uipath, preset, features) {
    this.hostname = hostname;
    this.uipath = uipath;
    this.preset = preset;
    this.features = features || [];
    this.render = false;
  }
}
