import { Component, OnInit, OnDestroy, trigger, transition, style, animate, state} from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus, Event, Device, DisplayInputMap } from './objects';
declare var swal: any;

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
    powerState: boolean;
    showing: boolean
    currentAudioLevel: number;
    startSpinning: boolean;

	public constructor(private socket: SocketService, private api: APIService) {
		this.messages = [];
		this.events = [];
		this.inputs = [];
		this.displays = [];
        this.showing = false;
        this.startSpinning = false;
	}

	public ngOnInit() {
		this.getData();
		this.muted = false;
		this.room = new Room();
        this.powerState = false;


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
        this.startSpinning = true;
        let body = {
            "power": "on"
        };
        this.api.putData(body).subscribe(data => {
             this.showing = true;
             this.updateState();
             this.startSpinning = false;
        });
    }

	// this need to be done eventually
	updateUI(e: Event) {
		console.log("update ui based on event:", e);	

		switch(e.eventInfoKey) {
			case "input":
				break;
			case "power":
				if (e.eventInfoValue == "on") {
					this.showing = true;
					this.updateState();
					this.startSpinning = false;
				} else {
        			this.showing = false;
				}
				break;
			case "volume":
				this.muted = false;
				this.volume = Number(e.eventInfoValue);
				break;
			case "Muted":
				this.muted = (e.eventInfoValue == 'true');
				break;
			default:
				console.log("unknown eventInfoKey:", e.eventInfoKey);
				break;
		}
	}

    updateState() {
        this.api.getRoomStatus().subscribe(data => {
			this.room.status = new RoomStatus();
			Object.assign(this.room.status, data);
			console.log("roomstatus:", this.room.status);	
            this.updateInputs();
        });
    }

	getData()  {
		this.api.setup();

		this.api.loaded.subscribe(data => {
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
		})
	}

	showHelp() {
		swal({
	 		title: 'Help',
	  		type: 'info',
	  		html:
	    		'Please call the clerks at 801-111-111 for help.',
	  		showCloseButton: true,
	  		confirmButtonText:
	    		'Done!',
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
        
        var body = {audioDevices: []}
        for (let speaker of this.displays) {
            if (speaker.selected) {
                body.audioDevices.push({
    				"name": speaker.name,
                    "muted": this.muted
                });
            }
        }
		this.api.putData(body);
	}

    powerOff() {
        let body = {
            "power": "standby"
        };
        this.api.putData(body);
        this.showing = !this.showing
    }

	updateVolume(volume: number) {
		this.volume = volume;

        var body = {audioDevices: []}
        for (let speaker of this.displays) {
            if (speaker.selected) {
                body.audioDevices.push({
    				"name": speaker.name,
                    "volume": this.volume
                });
            }
        }
		this.api.putData(body);
	}

	blank() {
        var body = {displays: []}
        for (let display of this.displays) {
            if (display.selected) {
				display.type = "panorama_wide_angle"
                body.displays.push({
                        "name": display.name,
                        "blanked": true 
                    }); 
            }
        }
		this.api.putData(body);
	}

	setOutputDevice(d: DisplayInputMap) {
		console.log("changing output to", d.displayName);
        d.selected = !d.selected;
	}

	setInputDevice(d: DisplayInputMap) {
        var body = {displays: []}
        for (let display of this.displays) {
            if (display.selected) {
                display.type = d.type;
                display.input = d.name;
                body.displays.push({
                        "name": display.name,
                        "input": d.name,
						"blanked": false
                    }); 
            }
        }
		this.api.putData(body);
	}

	setType(d: Device) {
		let dm = new DisplayInputMap();	
		dm.name = d.name;
		dm.displayName = d.display_name;
		switch (d.type) {
			case "hdmiin":
				dm.type = "settings_input_hdmi";
				break;
			case "overflow":
				dm.type = "people";
				break;
			case "computer":
				dm.type = "computer";
				break;
			case "iptv":
				break;
			case "appletv":
				dm.type = "airplay";
				break;
			default:
				dm.type = "generic input";
				break;
		}
		this.inputs.push(dm);

		console.log("added", dm.name, "of type", dm.type, "to inputs");
	}

    updateInputs() {
        //go through the list of status and set the current input 
        for (let display of this.room.status.displays) {
            for (let d of this.displays) {
                //check to make sure we map
                if (d.name == display.name) {
                    //go through and get the device mapping to the input
                    for (let input of this.inputs) {
                        if (input.name == display.input) {
                            d.input = input.name;
                            d.type = input.type;
                        }
                    }
                }
            }
        }


        var first = true;
        var count = 0;
        //go through and get the volumes, if only one device is selected, set the current room volume to that level.
        //else, i'm not sure. 
        // for muted, if all are muted, set the icon to muted, else show it as open.
        for (let speaker of this.room.status.audioDevices) {
            for (let display of this.displays) {
                if (speaker.name != display.name || !display.selected) {
                    continue;
                }
                if (first) {
                    //set the volume level
                    this.volume = speaker.volume;
                    count++;
                    this.muted = speaker.muted;
                } else {
                    //average it in
                    this.volume = ((this.volume * count) + speaker.volume)/ count + 1
                    count++

                    if (this.muted && !speaker.muted) {
                        this.muted = false;
                    }
                }
            }
        }
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

                    //everything is selected by default;
                    dm.selected = true;
					this.displays.push(dm);
                    has = true;
				}
			}	
            if (!has) {
                let dm = new DisplayInputMap();
                dm.name = display.name;
                dm.type = "panorama_wide_angle";
                //everything is selected by default
                dm.selected = true;
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
	}

	man1: boolean;
	man2: boolean;
	man3: boolean;

	management(n: number) {
		switch(n) {
			case 1:
				if (!this.man1 && !this.man2 && !this.man3) {
					this.man1 = true;
					console.log("defcon 4");
				}
				else {
					this.man1 = false;		
					this.man2 = false;
					this.man3 = false;
					console.log("defcon 5");	
				}
				break;
			case 2:
				if (this.man1) {
					this.man2 = true;
					console.log("defcon 3");
				}
				else {
					this.man1 = false;		
					this.man2 = false;
					this.man3 = false;
					console.log("defcon 5");	
				}
				break;
			case 3:
				if (this.man1 && this.man2) {
					this.man3 = true;
					console.log("defcon 2");	
				}
				else {
					this.man1 = false;
					this.man2 = false;
					this.man3 = false;
					console.log("defcon 5");	
				}
				this.man3 = true;
				break;
			case 4:
				if (this.man1 && this.man2 && this.man3) {
					console.log("defcon 1");
					this.man1 = false;
					this.man2 = false;
					this.man3 = false;
					this.showManagement();
				} else {
					this.man1 = false;
					this.man2 = false;
					this.man3 = false;
					console.log("defcon 5");	
				}
				break;
			default:
				this.man1 = false;
				this.man2 = false;
				this.man3 = false;
				console.log("defcon 5");	
				break;
		}
	}

	showManagement() {
		swal({
	 		title: 'Management',
	  		html:
	    		`
					<div style="display: flex; flex-direction: column; justify-content: center;">
						<div style="display: flex; justify-content: center; padding-bottom: 2vh;">
							<button class="btn btn-warning" onClick="refresh()">Refresh</button>
						</div>
						<div style="display: flex; justify-content: center; padding-bottom: 2vh;">
							<button class="btn btn-info" onClick="deviceInfo()">Device Info</button>
						</div>
						<div style="display: flex; justify-content: center; padding-bottom: 2vh;">
							<button class="btn btn-info">Docker Status</button>
						</div>
						<div style="display: flex; justify-content: center;">
							<button class="btn btn-danger" onClick="confirmreboot()">Reboot</button>
						</div>
					</div>
				`,
	  		showCloseButton: false,
	  		confirmButtonText:
	    		'Done!',
		})
	}

	refresh() {
		console.log("refreshing page...");
	}
} 
