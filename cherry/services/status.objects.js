// Constants
const POWER = "power";
const INPUT = "input";
const BLANKED = "blanked";
const MUTED = "muted";
const VOLUME = "volume";

class Device {
  constructor(name, displayname, icon) {
    this.name = name;
    this.displayname = displayname;
    this.icon = icon;
  }

  static filterDevices(names, devices) {
    if (!names || !devices) return [];
    return names.map(name => devices.find(d => d.name === name)).filter(Boolean);
  }

  static getDeviceByName(name, devices) {
    if (!name || !devices) return null;
    return devices.find(d => d.name === name) || null;
  }

  getName() {
    return this.name;
  }

  getDisplayName() {
    return this.displayname;
  }

  getIcon() {
    return this.icon;
  }
}

class Input extends Device {
  constructor(name, displayname, icon, subs) {
    super(name, displayname, icon);
    this.subInputs = subs || [];
    this.events = new EventTarget();
  }

  static getInput(name, inputs) {
    for (const i of inputs) {
      if (i.name === name) return i;
      if (i.subInputs && i.subInputs.length) {
        const found = i.subInputs.find(sub => sub.name === name);
        if (found) return found;
      }
    }
    return null;
  }

  onClick(callback) {
    this.events.addEventListener("click", callback);
  }

  emitClick() {
    this.events.dispatchEvent(new Event("click"));
  }
}

class Output extends Device {
  constructor(name, displayname, power, input, icon) {
    super(name, displayname, icon);
    this.power = power;
    this.input = input;
    this.events = new EventTarget();
  }

  static getPower(outputs) {
    return outputs.some(o => o.power === "on") ? "on" : "standby";
  }

  static isPoweredOn(outputs) {
    return outputs.every(o => o.power === "on");
  }

  static getInput(outputs) {
    let input = null;
    for (const o of outputs) {
      if (input == null) {
        input = o.input;
      } else if (o.input !== input) {
        return o.input; // conflict, return as-is (like your code)
      }
    }
    return input;
  }

  static setPower(s, outputs) {
    outputs.forEach(o => o.power = s);
  }

  static setInput(i, outputs) {
    outputs.forEach(o => o.input = i);
  }
}

class Display extends Output {
  constructor(name, displayname, power, input, blanked, icon, hidden) {
    super(name, displayname, power, input, icon);
    this.blanked = blanked;
    this.hidden = hidden;
  }

  static getBlank(displays) {
    return displays.every(d => d.blanked);
  }

  static setBlank(b, displays) {
    displays.forEach(d => d.blanked = b);
  }
}

class AudioDevice extends Output {
  constructor(name, displayname, power, input, muted, volume, icon, type, mixlevel) {
    super(name, displayname, power, input, icon);
    this.muted = muted;
    this.volume = volume;
    this.type = type;
    this.mixlevel = mixlevel;
  }

  static getVolume(audioDevices) {
    if (!audioDevices?.length) return 0;
    return audioDevices.reduce((sum, a) => sum + a.volume, 0) / audioDevices.length;
  }

  static getMute(audioDevices) {
    return audioDevices?.every(a => a.muted) || false;
  }

  static setVolume(v, audioDevices) {
    audioDevices.forEach(a => a.volume = v);
  }

  static setMute(m, audioDevices) {
    audioDevices.forEach(a => a.muted = m);
  }
}
