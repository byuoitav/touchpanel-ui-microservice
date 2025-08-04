class DataService extends EventTarget {
    constructor(apiService) {
        super();
        this.apiService = apiService;
        this.panel = null;
        this.inputs = [];
        this.displays = [];
        this.audioDevices = [];
        this.audioConfig = new Map();
        this.presets = [];
        this.panels = [];
        this.inputReachability = new Map();
        this.dividerSensor = null;
        this.camLink = null;
    }

    init() {
        this.createInputs();
        this.createOutputs();
        this.createPseudoInputs();
        this.createPresets();
        this.createPanels();

        this.inputReachability = APIService.room.config.input_reachability;

        this.dividerSensor = APIService.room.config.devices.find(d =>
            deviceHasRole(d, "DividerSensor")
        );
        if (this.dividerSensor != null) {
            this.setCurrentPreset();
        }
        console.log("DataService initialized with inputs, outputs, presets, and panels.");
        // Emit loaded event after all async setup is done
        setTimeout(() => {
            this.dispatchEvent(new CustomEvent("loaded", { detail: true }));
        }, 0);
    }

    createInputs() {
        const uiconfig = APIService.room.uiconfig;
        const config = APIService.room.config;
        if (!uiconfig.inputConfiguration) return;

        for (const ic of uiconfig.inputConfiguration) {
            const name = ic.name.split("|")[0];
            const inputDevice = config.devices.find(i => i.name === name);
            if (inputDevice && deviceHasRole(inputDevice, "VideoIn")) {
                const dispname = ic.displayname || inputDevice.display_name;
                const subs = (ic.subInputs || []).map(io => new Input(io.name, io.displayname, io.icon, []));
                this.inputs.push(new Input(ic.name, dispname, ic.icon, subs));
            }
        }
        console.info("Inputs:", this.inputs);
    }

    createOutputs() {
        const status = APIService.room.status;
        const config = APIService.room.config;
        const uiconfig = APIService.room.uiconfig;

        // Displays
        if (status.displays) {
            for (const s of status.displays) {
                const deviceConf = config.devices.find(d => d.name === s.name);
                const uiConf = uiconfig.outputConfiguration.find(d => d.name === s.name);
                if (deviceConf && uiConf) {
                    const hidden = deviceHasRole(deviceConf, "hidden");
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
        const pi = APIService.room.uiconfig.pseudoInputs;
        if (!pi) return;
        for (const p of pi) {
            console.log("pseudo input:", p);
        }
    }

    createPresets() {
        const presets = APIService.room.uiconfig.presets;
        for (const p of presets) {
            const displays = Device.filterDevices(p.displays, this.displays);
            const audioDevices = Device.filterDevices(p.audioDevices, this.audioDevices);
            const inputs = Device.filterDevices(p.inputs, this.inputs);
            const independentAudioDevices = Device.filterDevices(p.independentAudioDevices, this.audioDevices);

            let audioTypes;
            if (p.audioGroups) {
                audioTypes = new Map();
                for (const [key, group] of Object.entries(p.audioGroups)) {
                    audioTypes.set(key, Device.filterDevices(group, this.audioDevices));
                }
            }

            this.presets.push(new Preset(
                p.name, p.icon, displays, audioDevices, inputs,
                p.shareableDisplays, independentAudioDevices, audioTypes,
                30, 30, p.commands, p.volumeMatches, p.cameras, p.recording
            ));
        }
    }

    createPanels() {
        for (const p of APIService.room.uiconfig.panels) {
            const preset = this.presets.find(pre => pre.name === p.preset);
            const panel = new Panel(p.hostname, p.uipath, preset, p.features);
            if (p.hostname === window.APIService.piHostname) panel.render = true;
            this.panels.push(panel);
        }
        this.panel = this.panels.find(p => p.hostname === APIService.piHostname);
    }

    async setCurrentPreset() {
        if (!this.panel.features.includes("preset-switch")) return;

        const url = `http://localhost:8000/divider/preset/${APIService.piHostname}`;
        // const url = `http://${this.dividerSensor.address}:10000/divider/preset/${APIService.piHostname}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("HTTP error");
            let presetName = await response.text();
            if (typeof presetName !== 'string') presetName = String(presetName);
            const preset = this.presets.find(p => typeof p.name === 'string' && p.name.toLowerCase() === presetName.toLowerCase());
            if (preset) {
                console.log("setting initial preset to", preset);
                this.panel.preset = preset;
            }
        } catch (err) {
            console.error("Failed to get preset, retrying...", err);
            setTimeout(() => this.setCurrentPreset(), 5000);
        }
    }

    update(event) {
        console.log("Received event for update:", event.key, event.value, event["target-device"].deviceID);
        // Your Event.fromJson sets it as `detail`
        const e = event;
        console.log("e.key:", e.key);
        switch (e.key) {
            case "power":
            case "input":
                console.log("Updating device state:", e.key, e.value, e["target-device"].deviceID.split("-")[2]);
                this.updateDeviceState(e.key, e.value, e["target-device"].deviceID.split("-")[2]);
                break;
            case "blanked":
                this.updateDeviceState(e.key, e.value, e["target-device"].deviceID.split("-")[2]);

            case "muted":
            case "volume":
                // this.updateDeviceState(e.key, e.value, e["target-device"].deviceID);
                break;
            case "master-volume":
            case "master-mute":
                // this.updateMasterState(e.key, e.value, e.data);
                break;
            case "preset-switch":
                if (window.APIService.piHostname.toLowerCase() === e["target-device"].deviceID.toLowerCase()) {
                    const preset = this.presets.find(p => p.name.toLowerCase() === e.value.toLowerCase());
                    if (preset) {
                        console.log("switching preset to", preset);
                        this.panel.preset = preset;
                    }
                }
                break;
        }
    }

    updateDeviceState(key, value, deviceName) {
        console.log("Updating device state:", key, value, deviceName);
        if (key === "power" || key === "input") {
            let device = this.displays.find(d => d.name === deviceName) || this.audioDevices.find(a => a.name === deviceName);
            if (device) {
                if (key === "power") device.power = value;
                if (key === "input") {
                    device.input = Input.getInput(value, this.inputs);
                    window.components.display.updateUI(device.name, device.input ? device.input.name : "BLANK");
                }
            }
        } else if (key === "blanked") {
            const display = this.displays.find(d => d.name === deviceName);
            if (display) {
                display.blanked = value.toLowerCase() === "true";
            }
            if (display && display.blanked) {
                window.components.display.updateUI(display.name, "BLANK");
            }
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
        return APIService.room.config.devices.find(d => d.name === input.name);
    }
}


function deviceHasRole(device, role) {
    return device?.roles?.some(r => r._id === role);
}
