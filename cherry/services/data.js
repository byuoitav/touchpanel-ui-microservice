class DataService extends EventTarget {
  /**
   * Returns this instance as an EventTarget for event listening.
   * This allows GraphService and others to call getEventListener().addEventListener(...)
   */
  getEventListener() {
    return this;
  }
  constructor() {
    super();
    this.panel = null;
    this.inputs = [];
    this.displays = [];
    this.audioDevices = [];
    this.audioConfig = new Map();
    this.presets = [];
    this.panels = [];
    this.inputReachability = new Map();
    this.dividerSensor = null;

    // when your global APIService is loaded, build everything
    window.APIService.addEventListener("loaded", () => {
      this.createInputs();
      this.createOutputs();
      this.createPseudoInputs();
      this.createPresets();
      this.createPanels();

      this.inputReachability = window.APIService.room.config.input_reachability;

      // find divider sensor
      this.dividerSensor = window.APIService.room.config.devices.find(d =>
        d.hasRole("DividerSensor")
      );
      if (this.dividerSensor != null) {
        console.log("dividerSensor: ", this.dividerSensor);
        this.setCurrentPreset();
      }

      this.update();
      this.dispatchEvent(new CustomEvent("loaded", { detail: true }));
    });
  }

  createInputs() {
    const uiconfig = window.APIService.room.uiconfig;
    const config = window.APIService.room.config;
    if (!uiconfig.inputConfiguration) return;

    for (const ic of uiconfig.inputConfiguration) {
      const name = ic.name.split("|")[0];
      const inputDevice = config.devices.find(i => i.name === name);
      if (inputDevice && inputDevice.hasRole("VideoIn")) {
        const dispname = ic.displayname || inputDevice.display_name;
        const subs = (ic.subInputs || []).map(io => new Input(io.name, io.displayname, io.icon, []));
        this.inputs.push(new Input(ic.name, dispname, ic.icon, subs));
      }
    }
    console.info("Inputs:", this.inputs);
  }

  createOutputs() {
    const status = window.APIService.room.status;
    const config = window.APIService.room.config;
    const uiconfig = window.APIService.room.uiconfig;

    // Displays
    if (status.displays) {
      for (const s of status.displays) {
        const deviceConf = config.devices.find(d => d.name === s.name);
        const uiConf = uiconfig.outputConfiguration.find(d => d.name === s.name);
        if (deviceConf && uiConf) {
          const hidden = deviceConf.hasRole("hidden");
          this.displays.push(new Display(
            s.name, deviceConf.display_name, s.power,
            Input.getInput(s.input, this.inputs),
            s.blanked, uiConf.icon, hidden
          ));
        }
      }
    }

    // AudioDevices
    if (status.audioDevices) {
      for (const s of status.audioDevices) {
        const deviceConf = config.devices.find(d => d.name === s.name);
        const uiConf = uiconfig.outputConfiguration.find(d => d.name === s.name);
        if (deviceConf && uiConf) {
          this.audioDevices.push(new AudioDevice(
            s.name, deviceConf.display_name, s.power,
            Input.getInput(s.input, this.inputs),
            s.muted, s.volume, uiConf.icon, deviceConf.type._id, 100
          ));
        }
      }
    }

    // AudioConfig map
    if (uiconfig.audioConfiguration) {
      for (const ac of uiconfig.audioConfiguration) {
        const disp = this.displays.find(d => d.name === ac.display);
        const audioDevices = this.audioDevices.filter(a => ac.audioDevices.includes(a.name));
        this.audioConfig.set(disp, new AudioConfig(disp, audioDevices, ac.roomWide));
      }
    }
  }

  createPseudoInputs() {
    const pi = window.APIService.room.uiconfig.pseudoInputs;
    if (!pi) return;
    for (const p of pi) {
      console.log("pseudo input:", p);
    }
  }

  createPresets() {
    const presets = window.APIService.room.uiconfig.presets;
    for (const p of presets) {
      const displays = Device.filterDevices(p.displays, this.displays);
      const audioDevices = Device.filterDevices(p.audioDevices, this.audioDevices);
      const inputs = Device.filterDevices(p.inputs, this.inputs);
      const independentAudioDevices = Device.filterDevices(p.independentAudioDevices, this.audioDevices);

      const audioTypes = new Map();
      for (const [key, group] of Object.entries(p.audioGroups)) {
        audioTypes.set(key, Device.filterDevices(group, this.audioDevices));
      }

      this.presets.push(new Preset(
        p.name, p.icon, displays, audioDevices, inputs,
        p.shareableDisplays, independentAudioDevices, audioTypes,
        30, 30, p.commands, p.volumeMatches, p.cameras, p.recording
      ));
    }
  }

  createPanels() {
    for (const p of window.APIService.room.uiconfig.panels) {
      const preset = this.presets.find(pre => pre.name === p.preset);
      const panel = new Panel(p.hostname, p.uipath, preset, p.features);
      if (p.hostname === window.APIService.piHostname) panel.render = true;
      this.panels.push(panel);
    }
    this.panel = this.panels.find(p => p.hostname === window.APIService.piHostname);
  }

  async setCurrentPreset() {
    if (!this.panel.features.includes("preset-switch")) return;

    const url = `http://${this.dividerSensor.address}:10000/divider/preset/${window.APIService.piHostname}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("HTTP error");
      const presetName = await response.text();
      const preset = this.presets.find(p => p.name.toLowerCase() === presetName.toLowerCase());
      if (preset) {
        console.log("setting initial preset to", preset);
        this.panel.preset = preset;
      }
    } catch (err) {
      console.error("Failed to get preset, retrying...", err);
      setTimeout(() => this.setCurrentPreset(), 5000);
    }
  }

  update() {
    window.SocketService.getEventListener().subscribe(event => {
      if (event.type === "message") {
        const e = event.data;
        let target = (e.TargetDevice && e.TargetDevice.DeviceID || "").split("-");
        if (!target || target.length < 3) return;

        switch (e.Key) {
          case "power":
          case "input":
          case "blanked":
          case "muted":
          case "volume":
            this.updateDeviceState(e.Key, e.Value, target[2]);
            break;
          case "master-volume":
          case "master-mute":
            this.updateMasterState(e.Key, e.Value, e.Data);
            break;
          case "preset-switch":
            if (window.APIService.piHostname.toLowerCase() === e.TargetDevice.DeviceID.toLowerCase()) {
              const preset = this.presets.find(p => p.name.toLowerCase() === e.Value.toLowerCase());
              if (preset) {
                console.log("switching preset to", preset);
                this.panel.preset = preset;
              }
            }
            break;
        }
      }
    });
  }

  updateDeviceState(key, value, deviceName) {
    if (key === "power" || key === "input") {
      let device = this.displays.find(d => d.name === deviceName) || this.audioDevices.find(a => a.name === deviceName);
      if (device) {
        if (key === "power") device.power = value;
        if (key === "input") device.input = Input.getInput(value, this.inputs);
      }
    } else if (key === "blanked") {
      const display = this.displays.find(d => d.name === deviceName);
      if (display) display.blanked = value.toLowerCase() === "true";
    } else if (key === "muted") {
      const audioDevice = this.audioDevices.find(a => a.name === deviceName);
      if (audioDevice) audioDevice.muted = value.toLowerCase() === "true";
    } else if (key === "volume") {
      const audioDevice = this.audioDevices.find(a => a.name === deviceName);
      if (audioDevice) audioDevice.volume = parseInt(value, 10);
    }
  }

  updateMasterState(key, value, data) {
    for (const p of this.presets) {
      if (p.name === data || (p.volumeMatches && p.volumeMatches.includes(data))) {
        if (key === "master-volume") {
          p.masterVolume = parseInt(value, 10);
          p.masterMute = false;
        } else if (key === "master-mute") {
          p.masterMute = value.toLowerCase() === "true";
        }
      }
    }
  }

  getAudioConfigurations(displays) {
    return displays.map(d => this.audioConfig.get(d)).filter(Boolean);
  }

  hasRoomWide(audioConfigs) {
    return audioConfigs.some(config => config.roomWide);
  }

  getInputConfiguration(input) {
    return window.APIService.room.config.devices.find(d => d.name === input.name);
  }
}
