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
        APIService.room.config.devices.filter(device => device.hasRole('VideoIn') || device.hasRole('AudioIn')).forEach(input => {
            const inputConfiguration = APIService.room.uiconfig.inputConfiguration.find(i => i.name === input.name);
            if (inputConfiguration != null) {
                const i = new Input(input.name, input.display_name, inputConfiguration.icon);
                this.inputs.push(i);
            } else {
                console.warn('No input configuration found for:', input.name);
            }
        });

        console.info('Inputs', this.inputs);
    }

    private createOutputs() {
        // create displays
        for (const status of APIService.room.status.displays) {
            const config = APIService.room.config.devices.find(d => d.name === status.name);
            const deviceConfig = APIService.room.uiconfig.outputConfiguration.find(d => d.name === status.name);

            if (config != null) {
                if (deviceConfig != null) {
                    const d = new Display(status.name, config.display_name, status.power,
                        Input.getInput(status.input, this.inputs), status.blanked, deviceConfig.icon);
                    this.displays.push(d);
                } else {
                    console.warn('No device configuration found for this display: ', status.name);
                }
            } else {
                console.warn('No configuration found for this display:', status.name);
            }
        }

        console.info('Displays', this.displays);

        // create audioDevices
        for (const status of APIService.room.status.audioDevices) {
            const config = APIService.room.config.devices.find(d => d.name === status.name);
            const deviceConfig = APIService.room.uiconfig.outputConfiguration.find(d => d.name === status.name);

            if (config != null) {
                if (deviceConfig != null) {
                    const a = new AudioDevice(status.name, config.display_name, status.power,
                        Input.getInput(status.input, this.inputs), status.muted, status.volume, deviceConfig.icon, config.type._id, 100);
                    this.audioDevices.push(a);
                } else {
                    console.warn('No device configuration for this audio device: ', status.name);
                }
            } else {
                console.warn('No configuration found for this audio device:', status.name);
            }
        }

        console.info('AudioDevices', this.audioDevices);

        // create room wide audio map
        if (APIService.room.uiconfig.audioConfiguration != null) {
            for (const config of APIService.room.uiconfig.audioConfiguration) {
                // get display
                const display = this.displays.find(d => d.name === config.display);
                const audioDevices = this.audioDevices.filter(a => config.audioDevices.includes(a.name));

                this.audioConfig.set(display, new AudioConfig(display, audioDevices, config.roomWide));
            }

            // fill out rest of audio config
            for (const preset of APIService.room.uiconfig.presets) {
                if (preset.audioDevices == null) {
                    console.warn('no audio devices found for preset', preset.name);
                    continue;
                }

                const audioDevices = this.audioDevices.filter(a => preset.audioDevices.includes(a.name));

                for (const display of preset.displays) {
                    const disp: Display = this.displays.find(d => d.name === display);

                    if (!this.audioConfig.has(disp)) {
                        this.audioConfig.set(disp, new AudioConfig(disp, audioDevices, false));
                    }
                }
            }

            console.log('AudioConfig', this.audioConfig);
        } else {
            console.warn('No AudioConfig present.');
        }
    }

    private createPseudoInputs() {
        // create pseudo inputs
        if (APIService.room.uiconfig.pseudoInputs == null) {
            return;
        }

        for (const pi of APIService.room.uiconfig.pseudoInputs) {
            console.log('pseudo input:', pi);
        }
    }

    private createPresets() {
        for (const preset of APIService.room.uiconfig.presets) {
            const displays = Device.filterDevices<Display>(preset.displays, this.displays);
            const audioDevices = Device.filterDevices<AudioDevice>(preset.audioDevices, this.audioDevices);
            const inputs = Device.filterDevices<Input>(preset.inputs, this.inputs);
            const independentAudioDevices = Device.filterDevices<AudioDevice>(preset.independentAudioDevices, this.audioDevices);
            const audioTypes = new Map<string, AudioDevice[]>();
            independentAudioDevices.forEach(a => {
                audioTypes.set(a.type, audioTypes.get(a.type) || []);
                audioTypes.get(a.type).push(a);
            });

            const p = new Preset(preset.name, preset.icon, displays, audioDevices, inputs,
                preset.shareableDisplays, independentAudioDevices, audioTypes, 30, 30, preset.commands);
            this.presets.push(p);
        }

        console.info('Presets', this.presets);
    }

    private createPanels() {
        for (const panel of APIService.room.uiconfig.panels) {
            const preset = this.presets.find(p => p.name === panel.preset);

            this.panels.push(new Panel(panel.hostname, panel.uipath, preset, panel.features));
        }

        console.info('Panels', this.panels);

        this.panel = this.panels.find(p => p.hostname === APIService.piHostname);
        this.panel.render = true;

        console.info('Panel', this.panel);
    }

    private update() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type === MESSAGE) {
                const ew: EventWrapper = event.data;
                const e = ew.event;

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

                        display.blanked = (e.eventInfoValue.toLowerCase() === 'true');
                        break;
                    }
                    case MUTED: {
                        let audioDevice: AudioDevice;
                        audioDevice = this.audioDevices.find(a => a.name === e.device);

                        audioDevice.muted = (e.eventInfoValue.toLowerCase() === 'true');
                        break;
                    }
                    case VOLUME: {
                        let audioDevice: AudioDevice;
                        audioDevice = this.audioDevices.find(a => a.name === e.device);

                        audioDevice.volume = parseInt(e.eventInfoValue, 10);
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
        const audioConfigs: AudioConfig[] = [];

        for (const display of displays) {
            const config = this.audioConfig.get(display);

            if (config != null) {
                audioConfigs.push(config);
            }
        }

        return audioConfigs;
    }

    public hasRoomWide(audioConfigs: AudioConfig[]): boolean {
        for (const config of audioConfigs) {
            if (config.roomWide) {
                return true;
            }
        }

        return false;
    }

    public getInputConfiguration(input: Input): DeviceConfiguration {
        for (const device of APIService.room.config.devices) {
            if (device.name === input.name) {
                return device;
            }
        }
    }
}
