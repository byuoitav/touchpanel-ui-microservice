import { Injectable, EventEmitter } from '@angular/core';

import { APIService } from './api.service';
import { SocketService, MESSAGE, EventWrapper, Event } from './socket.service';
import { Preset, Panel, AudioConfig, DeviceConfiguration } from '../objects/objects';
import { Device, Input, Output, Display, AudioDevice, POWER, INPUT, BLANKED, VOLUME, MUTED } from '../objects/status.objects';

@Injectable()
export class DataService {
    public loaded: EventEmitter<boolean>;

    public panel: Panel;
    public inputs: Input[] = [];
    public displays: Display[] = [];
    public audioDevices: AudioDevice[] = [];
    public audioConfig: Map<Display, AudioConfig> = new Map();
    public presets: Preset[] = [];
    public panels: Panel[] = [];

    constructor(private api: APIService, private socket: SocketService) {
        this.loaded = new EventEmitter<boolean>();

        this.api.loaded.subscribe(() => {
            this.createInputs();
            this.createOutputs();
            this.createPseudoInputs();

			this.createPresets();
            this.createPanels();

            this.update();

            this.loaded.emit(true);
        }); 
    }

	private createInputs() {
        // create real inputs
        APIService.room.config.devices.filter(device => device.hasRole("VideoIn") || device.hasRole("AudioIn")).forEach(input => {
            let inputConfiguration = APIService.room.uiconfig.inputConfiguration.find(i => i.name == input.name);
            if (inputConfiguration != null) {
                let i = new Input(input.name, input.display_name, inputConfiguration.icon);
                this.inputs.push(i);
            } else 
                console.warn("No input configuration found for:", input.name);
        });

		console.info("Inputs", this.inputs);
	}

    private createOutputs() {
        // create displays
        for (let status of APIService.room.status.displays) {
            let config = APIService.room.config.devices.find(d => d.name == status.name);
            let deviceConfig = APIService.room.uiconfig.outputConfiguration.find(d => d.name == status.name);

            if (config != null) {
                if (deviceConfig != null) {
                    let d = new Display(status.name, config.display_name, status.power, Input.getInput(status.input, this.inputs), status.blanked, deviceConfig.icon)
                    this.displays.push(d);
                } else 
                    console.warn("No device configuration found for this display: ", status.name)
            } else 
                console.warn("No configuration found for this display:", status.name);
        }

        console.info("Displays", this.displays);

        // create audioDevices
        for (let status of APIService.room.status.audioDevices) {
            let config = APIService.room.config.devices.find(d => d.name == status.name);
            let deviceConfig = APIService.room.uiconfig.outputConfiguration.find(d => d.name == status.name);

            if (config != null) {
                if (deviceConfig != null) {
                    let a = new AudioDevice(status.name, config.display_name, status.power, Input.getInput(status.input, this.inputs), status.muted, status.volume, deviceConfig.icon, config.type._id, 100);
                    this.audioDevices.push(a);
                } else 
                    console.warn("No device configuration for this audio device: ", status.name)
            } else 
                console.warn("No configuration found for this audio device:", status.name);
        }

        console.info("AudioDevices", this.audioDevices);

        // create room wide audio map
        if (APIService.room.uiconfig.audioConfiguration != null) {
            for (let config of APIService.room.uiconfig.audioConfiguration) {
                // get display
                let display = this.displays.find(d => d.name === config.display);
                let audioDevices = this.audioDevices.filter(a => config.audioDevices.includes(a.name));

                this.audioConfig.set(display, new AudioConfig(display, audioDevices, config.roomWide));
            }

            // fill out rest of audio config
            for (let preset of APIService.room.uiconfig.presets) {
                if (preset.audioDevices == null) {
                    console.warn("no audio devices found for preset", preset.name)
                    continue;
                }

                let audioDevices = this.audioDevices.filter(a => preset.audioDevices.includes(a.name));

                for (let display of preset.displays) {
                    let d: Display = this.displays.find(d => d.name == display);

                    if (!this.audioConfig.has(d)) {
                        this.audioConfig.set(d, new AudioConfig(d, audioDevices, false));
                    }
                }
            }

            console.log("AudioConfig", this.audioConfig);
        } else 
            console.warn("No AudioConfig present.");
    }

    private createPseudoInputs() {
        // create pseudo inputs
        if (APIService.room.uiconfig.pseudoInputs == null)
            return;

        for (let pi of APIService.room.uiconfig.pseudoInputs) {
            console.log("pseudo input:", pi);
        }
    }

	private createPresets() {
        for (let preset of APIService.room.uiconfig.presets) {
            let displays = Device.filterDevices<Display>(preset.displays, this.displays);
            let audioDevices = Device.filterDevices<AudioDevice>(preset.audioDevices, this.audioDevices);
            let inputs = Device.filterDevices<Input>(preset.inputs, this.inputs);
            let independentAudioDevices = Device.filterDevices<AudioDevice>(preset.independentAudioDevices, this.audioDevices);
            let audioTypes = new Map<string, AudioDevice[]>(); 
            independentAudioDevices.forEach(a => {
                audioTypes.set(a.type, audioTypes.get(a.type) || []);
                audioTypes.get(a.type).push(a);
            });

            let p = new Preset(preset.name, preset.icon, displays, audioDevices, inputs, preset.shareableDisplays, independentAudioDevices, audioTypes, 30, 30, preset.commands);
            this.presets.push(p);
        }

        console.info("Presets", this.presets);
	} 

    private createPanels() {
        for (let panel of APIService.room.uiconfig.panels) {
            let preset = this.presets.find(p => p.name === panel.preset);

            this.panels.push(new Panel(panel.hostname, panel.uipath, preset, panel.features));
        }

        console.info("Panels", this.panels);

        this.panel = this.panels.find(p => p.hostname === APIService.piHostname);
        this.panel.render = true;

        console.info("Panel", this.panel);
    }

    private update() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let ew: EventWrapper = event.data;
                let e = ew.event;

                if (e.eventInfoValue.length > 0) {
                switch (e.eventInfoKey) {
                    case POWER: {
                        let output: Output;
                        output = this.displays.find(d => d.name === e.device);
                        if (output != null) {
                              output.power = e.eventInfoValue;
                        }

                        output = this.audioDevices.find(a => a.name === e.device);
                        if (output != null) {
                              output.power = e.eventInfoValue;
                        }

                        break;
                    }
                    case INPUT: {
                        let output: Output;
                        output = this.displays.find(d => d.name === e.device);
                        if (output != null) {
                            output.input = Input.getInput(e.eventInfoValue, this.inputs);
                        }

                        output = this.audioDevices.find(a => a.name === e.device);
                        if (output != null) {
                            output.input = Input.getInput(e.eventInfoValue, this.inputs);
                        }

                        break;
                    }
                    case BLANKED: {
                        let display: Display;
                        display = this.displays.find(d => d.name === e.device);

                        display.blanked = (e.eventInfoValue.toLowerCase() == 'true');
                        break;
                    }
                    case MUTED: {
                        let audioDevice: AudioDevice;
                        audioDevice = this.audioDevices.find(a => a.name === e.device);

                        audioDevice.muted = (e.eventInfoValue.toLowerCase() == 'true');
                        break;
                    }
                    case VOLUME: {
                        let audioDevice: AudioDevice;
                        audioDevice = this.audioDevices.find(a => a.name === e.device);

                        audioDevice.volume = parseInt(e.eventInfoValue);
                        break;
                    }
                    default: 
                        break; 
                }
                }
            }
        });
    }

    public getAudioConfigurations(displays: Display[]): AudioConfig[] {
        let audioConfigs: AudioConfig[] = [];

        for (let display of displays) {
            let config = this.audioConfig.get(display);

            if (config != null) {
                audioConfigs.push(config);
            }
        }

        return audioConfigs;
    }

    public hasRoomWide(audioConfigs: AudioConfig[]): boolean {
        for (let config of audioConfigs) {
            if (config.roomWide)
                return true;
        }

        return false;
    }

    public getInputConfiguration(input: Input): DeviceConfiguration {
        for (let device of APIService.room.config.devices) {
            if (device.name === input.name)
                return device;
        }
    }
}
