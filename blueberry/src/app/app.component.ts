import { Component, OnInit } from '@angular/core';

import { InputDevice, OutputDevice } from './objects';
import { APIService } from './api.service';
import { SocketService } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [APIService],
})
export class AppComponent implements OnInit {

	inputs: InputDevice[] = [];
	displays: OutputDevice[] = []; 

	constructor (private api: APIService, private socket: SocketService) {
	}

	public ngOnInit() {
		this.api.loaded.subscribe(() => {
			this.createInputDevices();
			this.createOutputDevices();
			this.organizeDisplays();
		});
	}

	private createInputDevices() {
		for (let device of APIService.room.config.devices) {
			if (device.hasRole('VideoIn') || device.hasRole('AudioIn')) {
				let input = APIService.uiconfig.inputdevices.find((i) => i.name == device.name);
				// TODO if input == null
				let i = new InputDevice();	
				i.name = device.name;
				i.displayname = device.display_name;
				i.icon = input.icon;

				this.inputs.push(i);
			}
		}

		console.info("Inputs", this.inputs);
	}

	private createOutputDevices() {
		for (let sdisplay of APIService.room.status.displays) {
			// TODO if these == null
			let cdisplay = APIService.room.config.devices.find((d) => d.name == sdisplay.name);
			let udisplay = APIService.uiconfig.displays.find((d) => d.name == sdisplay.name);

			if (udisplay != null) {
				let d = new OutputDevice();	
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

				// TODO d.selected?
				this.displays.push(d);

				// TODO REMOVE THIS! JUST FOR TESTING!
				//
				let dd = new OutputDevice;
				dd.names = d.names;
				dd.displayname = d.displayname;
				dd.icon = d.icon;
				dd.defaultinput = d.defaultinput;
				dd.inputs = d.inputs;
				dd.input = d.input;
				dd.blanked = d.blanked;
				this.displays.push(dd);
				// 
				// 
			}
		}
		console.info("Displays", this.displays);
	}

	private organizeDisplays() {
		let distance: number;
		let rows: number;
		let columns: number;

		switch(this.displays.length) {
			case 1:
				rows = 1;
				columns = 1;
				distance = 50;
				break;
			case 2:
				rows = 1;
				columns = 2;
				distance = 40;
				break;
			case 4:
				rows = 2;
				columns = 2;
				distance = 40;
				break;
		}

		for (let r = 0; r < rows; r++) {
			let index = r * columns;

			for (let c = 0; c < columns; c++) {
				if (c != 0) {
					index++;	
				}

				console.log("index",index + "; row:", r, "x col", c);	
				this.displays[index].top = "50vh"; // something with r
				this.displays[index].right = String(distance * c) + "%"; // something with c
			}	
		}
	}
}
