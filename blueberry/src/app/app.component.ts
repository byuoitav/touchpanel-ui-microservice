import { Component, OnInit } from '@angular/core';

import { Preset, StatusDevice, Display, AudioDevice, Input} from './objects';
import { APIService } from './api.service';
import { SocketService } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [APIService],
})
export class AppComponent implements OnInit {

	inputs: Input[] = [];
    statusDevices: StatusDevice[] = [];
    presets: Preset[] = [];
//    independentAudios: 

	constructor (private api: APIService, private socket: SocketService) {
	}

	public ngOnInit() {
		this.api.loaded.subscribe(() => {
			this.createInputDevices();
            this.createStatusDevices();
			this.createPresets();
			this.organizePresets();
		});
	}

	private createInputDevices() {
        APIService.room.config.devices.filter(device => device.hasRole("VideoIn") || device.hasRole("AudioIn")).forEach(input => {
            let inputConfiguration = APIService.room.uiconfig.inputConfiguration.find(i => i.name == input.name);
            let i = new Input(input.name, input.display_name, inputConfiguration.icon);
            this.inputs.push(i);
        });

		console.info("Inputs", this.inputs);
	}

    private createStatusDevices() {
        for (let status of APIService.room.status.displays) {
        
        }  
    }

	private createPresets() {
        /*
		for (let sdisplay of APIService.room.status.displays) {
			// TODO if these == null
			let cdisplay = APIService.room.config.devices.find((d) => d.name == sdisplay.name);
			let udisplay = APIService.uiconfig.displays.find((d) => d.name == sdisplay.name);

			if (udisplay != null) {
				let d = new Display();	
				d.names[0] = sdisplay.name;
				d.displayname = cdisplay.display_name;
				d.icon = udisplay.icon;

				d.defaultinput = this.inputs.find((i) => i.name == udisplay.defaultinput);
				udisplay.inputs.forEach(n => {
					let input = this.inputs.find((i) => i.name == n);
					if (input != null) d.inputs.push(input);
				});
				d.input = this.inputs.find((i) => i.name == sdisplay.input);

				d.blanked = sdisplay.blanked;
				d.power = sdisplay.power;

				d.audioDevice = this.createAudioDevice(d.names);

				this.displays.push(d);
			}
		}
		console.info("Displays", this.displays);
       */
	} 

	private organizePresets() {
		let rows: number;
		let columns: number;

		let baseWidth: number;
		let widthBetween: number = 0;
		let baseHeight: number; 
		let heightBetween: number = 0;

		// TODO mathematically deicde these numbers somehow
		switch(this.presets.length) {
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
				baseHeight = 30;
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

				this.presets[index].right = String(baseWidth + (c * widthBetween)) + "%"; // something with c
				this.presets[index].top = String(baseHeight + (r * heightBetween)) + "%"; // something with r
			}	
		}
	}
}
