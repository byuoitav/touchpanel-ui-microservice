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
	currInputs: Array<DisplayInputMap>;

	public constructor(private socket: SocketService, private api: APIService) {
		this.messages = [];
		this.events = [];
		this.inputs = [];
		this.currInputs = [];
	}

	public ngOnInit() {
		this.api.setup("ITB", "1101");
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

	updateUI(e: Event) {
		console.log("update ui based on event:", e);	

		switch(e.eventInfoKey) {
			case "power":
				break;
			case "volume":
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
			
//			for (let d of this.room.config.devices) {
//				if (this.hasRole(d, 'VideoOut'))
//					this.getInput(d);
//			}
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
	}

	updateVolume(volume: number) {
		console.log("curr volume", volume);
		this.volume = volume;
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
					this.currInputs.push(dm);
				}
			}	
		}

		for (let display of this.currInputs) {
			for (let device of this.room.config.devices) {
				if (display.name == device.name) {
					display.displayName = device.display_name;
					console.log("set display", display.name, "to have dn of", display.displayName);
				}
			}
		}
	}
}
