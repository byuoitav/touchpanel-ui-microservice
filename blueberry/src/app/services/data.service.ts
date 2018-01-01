import { Injectable, EventEmitter } from '@angular/core';

import { APIService } from './api.service';
import { SocketService, MESSAGE } from './socket.service';
import { Preset, Panel, AudioConfig } from '../objects/objects';
import { Device, Input, Output, Display, AudioDevice, POWER, INPUT, BLANKED, MUTED, VOLUME } from '../objects/status.objects';

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

			this.createPresets();
            this.createPanels();

            this.loaded.emit(true);
        }); 

        this.update();
    }

	private createInputs() {
        APIService.room.config.devices.filter(device => device.hasRole("VideoIn") || device.hasRole("AudioIn")).forEach(input => {
            let inputConfiguration = APIService.room.uiconfig.inputConfiguration.find(i => i.name == input.name);
            let i = new Input(input.name, input.display_name, inputConfiguration.icon);
            this.inputs.push(i);
        });

		console.info("Inputs", this.inputs);
	}

    private createOutputs() {
        // create displays
        for (let status of APIService.room.status.displays) {
            let config = APIService.room.config.devices.find(d => d.name == status.name);

            let d = new Display(status.name, config.display_name, status.power, Input.getInput(status.input, this.inputs), status.blanked)
            this.displays.push(d);
        }

        console.info("Displays", this.displays);

        // create audioDevices
        for (let status of APIService.room.status.audioDevices) {
            let config = APIService.room.config.devices.find(d => d.name == status.name);

            let a = new AudioDevice(status.name, config.display_name, status.power, Input.getInput(status.input, this.inputs), status.muted, status.volume);
            this.audioDevices.push(a);
        }

        console.info("AudioDevices", this.audioDevices);

        // create room wide audio map
        for (let config of APIService.room.uiconfig.audioConfiguration) {
            // get display
            let display = this.displays.find(d => d.name === config.display);
            let audioDevices = this.audioDevices.filter(a => config.audioDevices.includes(a.name));

            this.audioConfig.set(display, new AudioConfig(display, audioDevices, config.roomWide));
        }

        // fill out rest of audio config
        for (let preset of APIService.room.uiconfig.presets) {
            let audioDevices = this.audioDevices.filter(a => preset.audioDevices.includes(a.name));

            for (let display of preset.displays) {
                let d: Display = this.displays.find(d => d.name == display);

                if (!this.audioConfig.has(d)) {
                    this.audioConfig.set(d, new AudioConfig(d, audioDevices, false));
                }
            }
        }

        console.log("AudioConfig", this.audioConfig);
    }

	private createPresets() {
        for (let preset of APIService.room.uiconfig.presets) {
            let displays = Device.filterDevices<Display>(preset.displays, this.displays);
            let audioDevices = Device.filterDevices<AudioDevice>(preset.audioDevices, this.audioDevices);
            let inputs = Device.filterDevices<Input>(preset.inputs, this.inputs);

            let p = new Preset(preset.name, preset.icon, displays, audioDevices, inputs, preset.shareableDisplays);  
            this.presets.push(p);
        }

        console.info("Presets", this.presets);
	} 

    private createPanels() {
        for (let panel of APIService.room.uiconfig.panels) {
            let preset = this.presets.find(p => p.name === panel.preset);
            let independentAudioDevices = Device.filterDevices<AudioDevice>(panel.independentAudioDevices, this.audioDevices);

            this.panels.push(new Panel(panel.hostname, panel.uipath, preset, panel.features, independentAudioDevices));

        }
        console.info("Panels", this.panels);

        this.panel = this.panels.find(p => p.hostname === APIService.piHostname);
        this.panel.render = true;

        console.info("Panel", this.panel);
    }

    private update() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let e = event.data;
                console.log("recieved event", e);
                
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
}
