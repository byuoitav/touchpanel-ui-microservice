import { Injectable } from '@angular/core';

import { APIService } from './api.service';
import { SocketService, MESSAGE } from './socket.service';
import { Preset, Panel } from '../objects/objects';
import { Device, Input, Output, Display, AudioDevice, POWER, INPUT, BLANKED, MUTED, VOLUME } from '../objects/status.objects';

@Injectable()
export class DataService {
    public panel: Panel;
    public inputs: Input[] = [];
    public displays: Display[] = [];
    public audioDevices: AudioDevice[] = [];
    public presets: Preset[] = [];

    constructor(private api: APIService, private socket: SocketService) {
        this.api.loaded.subscribe(() => {
            this.createInputs();
            this.createOutputs();

			this.createPresets();
            this.createPanel();

            this.panel.render = true;
            console.info("Panel", this.panel);
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

        // create audioDevices
        for (let status of APIService.room.status.audioDevices) {
            let config = APIService.room.config.devices.find(d => d.name == status.name);
            let roomWide: boolean = APIService.room.uiconfig.roomWideAudios.includes(status.name);

            let a = new AudioDevice(status.name, config.display_name, status.power, Input.getInput(status.input, this.inputs), status.muted, status.volume, roomWide);
            this.audioDevices.push(a);
        }

        console.info("Outputs", this.audioDevices);
    }

	private createPresets() {
        for (let preset of APIService.room.uiconfig.presets) {
            let displays =  Device.filterDevices<Display>(preset.displays, this.displays);
            let audioDevices = Device.filterDevices<AudioDevice>(preset.audioDevices, this.audioDevices);
            let inputs = Device.filterDevices<Input>(preset.inputs, this.inputs);

            let p = new Preset(preset.name, preset.icon, displays, audioDevices, inputs)  
            this.presets.push(p);
        }

        console.info("Presets", this.presets);
	} 

    private createPanel() {
        // find my panel
        let panel = APIService.room.uiconfig.panels.find(p => p.hostname == APIService.hostname)

        let presets = Preset.filterPresets(panel.presets, this.presets);
        let independentAudioDevices = Device.filterDevices<AudioDevice>(panel.independentAudioDevices, this.audioDevices);

        this.panel = new Panel(panel.hostname, panel.uipath, presets, panel.features, independentAudioDevices);
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
                        if (output == null) {
                            output = this.audioDevices.find(a => a.name === e.device);
                        }

                        output.power = e.eventInfoValue;
                        break;
                    }
                    case INPUT: {
                        let output: Output;
                        output = this.displays.find(d => d.name === e.device);
                        if (output == null) {
                            output = this.audioDevices.find(a => a.name === e.device);
                        }

                        output.input = Input.getInput(e.eventInfoValue, this.inputs);
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


}
