import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus, Event, Device, DisplayInputMap } from './objects';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [APIService, SocketService]
})
export class AppComponent {
	messages: Array<any>;
	events: Array<Event>;
	room: Room;
	volume: number;
	muted: boolean;
	inputs: Array<DisplayInputMap>;
	displays: Array<DisplayInputMap>;
	roomOutput: DisplayInputMap;

	public constructor(private socket: SocketService, private api: APIService) {
		this.messages = [];
		this.events = [];
		this.inputs = [];
		this.displays = [];
	}

	public ngOnInit() {
		this.api.setup("ITB", "1101");
		this.muted = false;
		this.room = new Room();
		this.getData();


		this.socket.getEventListener().subscribe(event => {
			if(event.type == MESSAGE) {
				let data = JSON.parse(event.data.data);
				
				let e = new Event();
				Object.assign(e, data);
				this.events.push(e);

				// do stuff with event
				this.updateUI(e);
			} else if(event.type == CLOSE) {
				this.messages.push("The socket connection has been closed");
			} else if(event.type == OPEN) {
				this.messages.push("The socket connection has been opened");
			}
		})	
	} 

	public ngOnDestroy() {
		this.socket.close();
	}

	// this need to be done eventually
	updateUI(e: Event) {
		console.log("update ui based on event:", e);	

		switch(e.eventInfoKey) {
			case "input":
				break;
			case "power":
				break;
			case "volume":
				break;
			case "Muted":
				let isTrue = (e.eventInfoValue == 'true');
				this.muted = isTrue; 
				break;
			default:
				console.log("unknown eventInfoKey:", e.eventInfoKey);
				break;
		}
	}

	getData()  {
		this.api.getRoomConfig().subscribe(data => {
			this.room.config = new RoomConfiguration();
			Object.assign(this.room.config, data);
			console.log("roomconfig:", this.room.config);
		});

		this.api.getRoomStatus().subscribe(data => {
			this.room.status = new RoomStatus();
			Object.assign(this.room.status, data);
			console.log("roomstatus:", this.room.status);	

			for (let d of this.room.config.devices) {
				if (this.hasRole(d, 'VideoIn'))
					this.setType(d);
			}
			
			this.getInputs();
		})
	}

	hasRole(d: Device, role: string): boolean {
		for (let r of d.roles) {
			if (r == role)
				return true;
		}	
		return false;
	}

	toggleMute() {
		if (this.muted)
			this.muted = false;
		else
			this.muted = true;

		let body = {
			"audioDevices": [{
				"name": this.roomOutput.name,
				"muted": this.muted 
			}]
		};
		this.api.putData(body);
	}

	updateVolume(volume: number) {
		this.volume = volume;

		let body = {
			"audioDevices": [{
				"name": this.roomOutput.name,
				"volume": this.volume
			}]
		};
		this.api.putData(body);
	}

	setOutputDevice(d: DisplayInputMap) {
		console.log("changing output to", d.displayName);
		this.roomOutput = d;
	}

	setInputDevice(d: DisplayInputMap) {
		console.log("changing input of", this.roomOutput.displayName, "to", d.name);
		this.roomOutput.type = d.type;
		
		let body = {
			"displays": [{
				"name": this.roomOutput.name,
				"input": d.name 
			}]
		};
		this.api.putData(body);
	}

	setType(d: Device) {
		let dm = new DisplayInputMap();	
		dm.name = d.name;
		switch (d.type) {
			case "hdmiin":
				dm.type = "settings_input_hdmi";
				break;
			case "overflow":
				dm.type = "people"
				break;
			default:
				dm.type = "generic input";
				break;
		}
		this.inputs.push(dm);

		console.log("added", dm.name, "of type", dm.type, "to inputs");
	}

	getInputs() {
		for (let display of this.room.status.displays) {
			for (let input of this.inputs) {
				if (display.input == input.name) {
					console.log("display", display.name, "has input", input.name);
					let dm = new DisplayInputMap();
					dm.name = display.name;
					dm.type = input.type; 
					this.displays.push(dm);
				}
			}	
		}

		for (let display of this.displays) {
			for (let device of this.room.config.devices) {
				if (display.name == device.name) {
					display.displayName = device.display_name;
					console.log("set display", display.name, "to have dn of", display.displayName);
				}
			}
		}

		this.roomOutput = this.displays[0];
	}
}
