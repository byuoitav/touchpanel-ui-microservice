import { Component, OnInit, OnDestroy, trigger, transition, style, animate, state} from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus, Event, Device, DisplayInputMap } from './objects';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [APIService, SocketService],
  animations: [
    trigger('fadeInOut', [
      transition('void => *', [
          style({opacity:0}), //style only for transition transition (after transiton it removes)
          animate('2s', style({opacity:1})) // the new state of the transition(after transiton it removes)
        ]),
      transition('* => void', [
          animate('2s', style({opacity:0})) // the new state of the transition(after transiton it removes)
        ])
    ])
  ]
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
    powerState: boolean;
    powerIcon: string;
    showing: boolean

	public constructor(private socket: SocketService, private api: APIService) {
		this.messages = [];
		this.events = [];
		this.inputs = [];
		this.displays = [];
        this.showing = false;
	}

	public ngOnInit() {
		this.api.setup("ITB", "1101");
		this.muted = false;
		this.room = new Room();
		this.getData();
        this.powerState = false;
        this.powerIcon = "power_settings_new"


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

    enterScreen() {
        let body = {
            "power": "on"
        };
        this.api.putData(body);
        this.showing = true;
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

    togglePower() {
        let body = {
            "power": "standby"
        };
        this.powerIcon = "power_settings_new";
        this.api.putData(body);
        this.showing = !this.showing
    }

	updateVolume(volume: number) {
		this.volume = volume;

        //currently we only have videoout devices
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
        d.selected = !d.selected;
		this.roomOutput = d;
	}

	setInputDevice(d: DisplayInputMap) {
		console.log("changing input of", this.roomOutput.displayName, "to", d.name);

        var body = {displays: []}
        for (let display of this.displays) {
            if (display.selected) {
                display.type = d.type;
                body.displays.push({
                        "name": display.name,
                        "input": d.name 
                    }); 
            }
        }
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

    //we need to allow for the case that the display is off, in which case it's status will come back with a blank input
	getInputs() {
		for (let display of this.room.status.displays) {
            var has = false;
			for (let input of this.inputs) {
				if (display.input == input.name) {
					console.log("display", display.name, "has input", input.name);
					let dm = new DisplayInputMap();
					dm.name = display.name;
					dm.type = input.type; 
					this.displays.push(dm);
                    has = true;
				}
			}	
            if (!has) {
                let dm = new DisplayInputMap();
                dm.name = display.name;
                dm.type = "panorama_wide_angle";
                this.displays.push(dm);
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
