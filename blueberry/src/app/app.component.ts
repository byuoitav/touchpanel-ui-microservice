import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { Preset, Panel } from './objects';
import { Device, Input, Output, Display, AudioDevice, POWER, INPUT, BLANKED, MUTED, VOLUME } from './status.objects';
import { APIService } from './api.service';
import { SocketService, MESSAGE } from './socket.service';
import { WheelComponent } from './wheel.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', './colors.scss'],
  providers: [APIService],
})
export class AppComponent implements OnInit {

    // contains all information for this panel
    panel: Panel;

    // contains all inputs in the room
	inputs: Input[] = [];

    // contains all displays in the room
    displays: Display[] = [];

    // contains all audioDeivces in the room
    audioDevices: AudioDevice[] = [];

    // contains all presets for the room
    presets: Preset[] = [];

    locked: boolean = true;

	constructor (private api: APIService, private socket: SocketService) {}

	public ngOnInit() {
		this.api.loaded.subscribe(() => {
            this.createInputs();
            this.createOutputs();

			this.createPresets();
            this.createPanel();
			this.organizePresets();

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

            let a = new AudioDevice(status.name, config.display_name, status.power, Input.getInput(status.input, this.inputs), status.muted, status.volume);
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

	private organizePresets() {
		let rows: number;
		let columns: number;

		let baseWidth: number;
		let widthBetween: number = 0;
		let baseHeight: number; 
		let heightBetween: number = 0;

		// TODO mathematically deicde these numbers somehow
		switch(this.panel.presets.length) {
			case 1:
				rows = 1;
				columns = 1;

				baseWidth = 50;
				baseHeight = 30;
				break;
			case 2:
				rows = 1;
				columns = 2;

				baseWidth = 35;
				widthBetween = 32;
				baseHeight = 50;
				break;
			case 4:
				rows = 2;
				columns = 2;
				break;
		}

		for (let r = 0; r < rows; r++) {
			let index = r * columns;

			for (let c = 0; c < columns; c++) {
				if (c != 0) {
					index++;	
				}

				this.panel.presets[index].right = String(baseWidth + (c * widthBetween)) + "vw"; // something with c
				this.panel.presets[index].top = String(baseHeight + (r * heightBetween)) + "vh"; // something with r
			}	
		}
	}

    private update() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let e = event.data;
                console.log("event", e);
                
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

    @ViewChild(WheelComponent)
    private defaultPreset: WheelComponent;

    public unlock() {
        this.defaultPreset.command.setPower('on', this.defaultPreset.preset.displays);

        this.locked = false;
        setTimeout(() => {
            this.defaultPreset.open(0);
        }, 1000); // duration of transition
    }

    public lock() {
        console.log("here");
        this.locked = true;
    }
}
