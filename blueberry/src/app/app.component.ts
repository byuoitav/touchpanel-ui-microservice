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
		this.api.setupHostname();
		this.api.loaded.subscribe(() => {
			this.createInputDevices();
			this.createOutputDevices();
		});
	}

	private createInputDevices() {
		for (let device of this.api.room.config.devices) {
			if (device.hasRole('VideoIn') || device.hasRole('AudioIn')) {
				let input = this.api.uiconfig.inputdevices.find((i) => i.name == device.name);
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
		for (let sdisplay of this.api.room.status.displays) {
			// TODO if these == null
			let cdisplay = this.api.room.config.devices.find((d) => d.name == sdisplay.name);
			let udisplay = this.api.uiconfig.displays.find((d) => d.name == sdisplay.name);

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
			}
		}
		console.info("Displays", this.displays);
	}

	// app component sets up the devices from the api's information
	// wheel component stores that information (the output displays, at least)
	// another component sends the commands
	// app component updates the displays with info from the socket?
}
