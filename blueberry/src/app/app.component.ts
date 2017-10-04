import { Component, OnInit } from '@angular/core';

import { InputDevice } from './objects';
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

	constructor (private api: APIService, private socket: SocketService) {
	}

	public ngOnInit() {
		this.api.loaded.subscribe(() => {
			console.log("api data ready");
			this.createInputDevices();
		})
	}

	private createInputDevices() {
		for (let input of this.api.room.config.devices) {
			if (input.hasRole('VideoIn') || input.hasRole('AudioIn')) {
				for (let i of this.api.uiconfig.inputdevices) {
					if (i.name == input.name) {
						let ii = new InputDevice();	
						ii.name = input.name;
						ii.displayname = input.displayname;
						ii.icon = i.icon;
						console.log("created input", ii);
						this.inputs.push(ii);
					}	
				}	
			}	
		}	
	}

	// app component sets up the devices from the api's information
	// wheel component stores that information (the output displays, at least)
	// another component sends the commands
	// app component updates the displays with info from the socket?
}
