import { Component, OnInit, OnDestroy, trigger, transition, style, animate, state, ViewChild, ElementRef } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService, CookieOptions } from 'ngx-cookie';
import { NotificationsService } from 'angular2-notifications';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus, Event, Device, DeviceData, OutputDevice, icons, InputDevice, AudioOutDevice, AudioConfig, Mic } from './objects';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [APIService, SocketService],
  animations: [
    trigger('fadeInOut', [
      transition('void => *', [
        style({ opacity: 0 }), //style only for transition transition (after transiton it removes)
        animate('.2s', style({ opacity: 1 })) // the new state of the transition(after transiton it removes)
      ]),
      transition('* => void', [
        animate('2s', style({ opacity: 0 })) // the new state of the transition(after transiton it removes)
      ])
    ]),
    trigger('blankedIcon', [
      transition('void => *', [
        animate('.2s', style({ fontSize: '17vh'})) 
      ]),
      transition('* => void', [
        animate('.2s', style({ fontSize: '0vh'})) 
      ])
    ]),
    trigger('inputIcon', [
      transition('void => *', [
        animate('.2s', style({ fontSize: '27vh'})) 
      ]),
      transition('* => void', [
        animate('.2s', style({ fontSize: '0vh'})) 
      ])
    ]),
  ],
})
export class AppComponent { // event stuff
  TITLE_ANGLE: number = 100; 
  TITLE_ANGLE_ROTATE: number = this.TITLE_ANGLE / 2;

  // events
  events: Array<Object>;
  // room data
  room: Room;
  roomname: string;
  // display information	
  inputs: Array<InputDevice>;
  displays: Array<OutputDevice>;
  audiodevices: Array<AudioOutDevice>;
  mics: Array<Mic>;
  powerState: boolean;
  // "lock" screen
  showing: boolean
  currentAudioLevel: number;
  startSpinning: boolean;
  sendingOn: boolean;
  // circle stuff
  @ViewChild('ring') ring: ElementRef;
  arcpath: string;
  titlearcpath: string;
  ringopen: boolean;
  rightoffset: string;
  topoffset: string;
  // display selection
  displayselection: boolean; 
  // multi-display data 
  multipledisplays: boolean;
  selectedDisplay: OutputDevice; 
  selectedAudio: AudioOutDevice;
  // help
  helprequested: boolean;
  // audio data
  microphone: boolean;
  microphonecontrol: boolean;

  // features
  displaytoall: boolean;
  poweroffall: boolean;
  dev: boolean;

  // notifications
  public notificationOptions = {
 	position: ["top","right"],
    timeOut: 3500,
	maxStack: 3,
	animate: "fromLeft",
	preventDuplicates: true,
  }

  public constructor(private socket: SocketService, private api: APIService, private cookie: CookieService, private notify: NotificationsService) {
    this.inputs = [];
	this.events = [];
    this.displays = [];
	this.audiodevices = [];
	this.mics = [];
    this.showing = false;
    this.startSpinning = false;
    this.sendingOn = false;
	this.ringopen = false;
	this.displaytoall = false;
	this.poweroffall = false;

    // management
    this.deviceInfo = new Object();
    this.dockerStatus = new Object();
  }

  public ngOnInit() {
	this.selectedDisplay = new OutputDevice();
	this.selectedDisplay.oaudiodevices = null; 

	this.socketSetup();
	this.helprequested = false;
	this.displayselection = false;
   	this.dev = false;
	
	// uncomment for local testing
//   	this.showing = true;
  }

  socketSetup() {
    this.socket.getEventListener().subscribe(event => {
      if (event.type == MESSAGE) {
        let data = JSON.parse(event.data.data);

        let e = new Event();
        Object.assign(e, data);
		if (this.dev) {
			if (this.events.length > 250) 	
				this.events.splice(0, 125); 
			
			this.events.push(e);	
			let element = document.getElementById('dev-console');
	    	setTimeout(() => { element.scrollTop = element.scrollHeight; }, 0)
		}

        // do stuff with event
        this.updateUI(e);
      } else if (event.type == CLOSE) {
		console.log("The socket connection has been closed");
		this.notify.error("Socket", "Socket connection closed", {
			timeOut: 2000,
			showProgressBar: false,
			clickToClose: false
		});
      } else if (event.type == OPEN) {
        console.log("The socket connection has been opened");
		this.notify.success("Socket", "Socket connection opened");

    	this.api.setup();
		this.api.loaded.subscribe(data => {
			this.notify.success("Setup", "got hostname and ui config", {
				timeOut: 2500,
				showProgressBar: false,
				clickToClose: false
			});
   		 	this.getData();
		});
      }
    })
  }

  public ngOnDestroy() {
    this.socket.close();
  }

  put(body: any, success: Function = func => { }, err: Function = func => { }, completed: Function = func => { }): void {
    this.api.putData(body).subscribe(
      data => {
        success();
      },
      error => {
        console.log("error:", error);
        err();
      },
      () => {
        completed();
      }
    );
  }

  get(url: string, success: Function = func => { }, err: Function = func => { }, completed: Function = func => { }): void {
    this.api.get(url).subscribe(
      data => {
        success();
      },
      error => {
        console.log("error:", error);
        err();
      },
      () => {
        completed();
      }
    );
  }

  getData() {
    this.room = new Room();
	this.roomname = this.api.building + " " + this.api.room;

	this.getRoomConfig();
  }

  getRoomConfig() {
    this.api.getRoomConfig().subscribe(data => {
        this.room.config = new RoomConfiguration();
        Object.assign(this.room.config, data);
        console.log("roomconfig:", this.room.config);

		this.notify.success("Setup", "got room config", {
			timeOut: 2500,
			showProgressBar: false,
			clickToClose: false
		});

		this.getRoomStatus();
    },
	err => {
		this.notify.error("Setup", "Failed to get room config");
		setTimeout(() => this.getRoomConfig(), 5000);
	});
  }

  getRoomStatus() {
      this.api.getRoomStatus().subscribe(data => {
        this.room.status = new RoomStatus();
        Object.assign(this.room.status, data);
        console.log("roomstatus:", this.room.status);

		this.notify.success("Setup", "got room status", {
			timeOut: 2500,
			showProgressBar: false,
			clickToClose: false
		});

		this.createInputDevices();
        this.createOutputDevices();
		this.setupFeatures(); 

		this.dtaMasterHost = this.api.hostname;
      },
	  err => {
		this.notify.error("Setup", "Failed to get room status");
		setTimeout(() => this.getRoomStatus(), 5000);
	  });
  }

  createInputDevices() {
	this.inputs = [];
 	for(let input of this.room.config.devices) {
		if (this.hasRole(input, 'VideoIn') || this.hasRole(input, 'AudioIn')) {
			for (let i of this.api.uiconfig.inputdevices) {
				if (i.name == input.name) {
					let ii = new InputDevice();
					ii.name = input.name;
					ii.displayname = input.display_name;
					ii.icon = i.icon;
					console.log("Created input", ii);
					this.inputs.push(ii);
				}
			}
		}
	}
  }

  createOutputDevices() {
	this.displays = [];
	for (let sdisplay of this.room.status.displays) {
		for (let cdisplay of this.room.config.devices) {
			if (sdisplay.name == cdisplay.name) {
				for (let jdisplay of this.api.uiconfig.displays) {
					if (jdisplay.name == sdisplay.name) {
						let d = new OutputDevice();
						d.name = sdisplay.name;
						d.displayname = cdisplay.display_name;
						d.icon = jdisplay.icon;
						d.selected = true;
						d.odefaultinput = this.getInputDevice(jdisplay.defaultinput);
						d.oinputs = [];
						for (let i of jdisplay.inputs) {
							d.oinputs.push(this.getInputDevice(i));
						}

						d.oinput = this.getInputDevice(sdisplay.input); 
						d.blanked = sdisplay.blanked;

						console.log("Created display:", d);

                        //if my display(s) are already on, go ahead and show the control screen
                        if (sdisplay.power == 'on') {
                            this.showing = true;
                        }

						this.displays.push(d);
					}
				}
			}
		}	
	}

	this.audiodevices = [];
	// create audio out devices
	for (let ac of this.api.uiconfig.audio) {
		for (let a of ac.audiodevices) {
			for (let sa of this.room.status.audioDevices) {
				if (sa.name == a) {
					let ad = new AudioOutDevice(); 
					ad.name = a;
					ad.power = sa.power;
					ad.input = sa.input;
					ad.volume = sa.volume;
					ad.muted = sa.muted;

					this.audiodevices.push(ad);
				}
			}
		}
	}

	this.mics = [];
	// create microphones
	for (let m of this.room.config.devices) {
		if (m.roles.includes("Microphone")) {
			for (let sm of this.room.status.audioDevices) {
				if (sm.name == m.name) {
					console.log("status", sm);	
					let mic = new Mic();
					mic.name = m.name;
					mic.displayname = m.display_name;
					mic.volume = sm.volume;
					mic.muted = sm.muted;

					
					console.log("Created microphone", mic);
					this.mics.push(mic);
					break;		
				}	
			}
		}	
	}

	this.audiodevices = Array.from(new Set(this.audiodevices)); // clean up duplicates
	console.log("All audio devices:", this.audiodevices);

	if (this.displays.length == 1) {
		this.multipledisplays = false;
		let arr = [];
		arr.push(this.displays[0].name);
		this.changeControl(arr, false);
	} else {
		this.multipledisplays = true;
		console.log("Defaulting to controlling all displays and their associated audio devices");
		let all = [];
		for (let d of this.displays) {
			all.push(d.name);
		}

		this.changeControl(all, true);
	}
  }

  changeControl(names: string[], changeInput: boolean) {
	  	console.log("Changing control to:", names);
	  	if (names.length == 0) {
			console.error("names is empty. need at least one display's name.", names);
			this.multipledisplays = false;
			return;
		} else if (names.length == 1) {
			this.selectedDisplay = this.getOutputDevice(names[0]);	
			// select/deselect the correct displays
			for (let d of this.displays) {
				for (let n of names) {
					if (d.name == n) {
						d.selected = true;
						break;
					} else {
						d.selected = false;	
					}
				}
			}
			this.selectedDisplay.oaudiodevices = this.getAudioDevices(names);
		} else {
		  	console.log("Starting control of displays:", names);
			// select/deselect the correct displays
			for (let d of this.displays) {
				for (let n of names) {
					if (d.name == n) {
						d.selected = true;
						break;
					} else {
						d.selected = false;	
					}
				}
			}
	
			let displays: OutputDevice[];
			displays = [];
			for (let n of names)
				displays.push(this.getOutputDevice(n));
	
			let md = new OutputDevice();
			md.name = "all control";
			md.displayname = "all devices";
			md.icon = "device_hub";	
			md.blanked = true;
	
			// build out common features (inputs, defaultinput)
			let inputs: InputDevice[] = [];
			let defaultinputs: InputDevice[] = [];
	
			for (let display of displays) {
				for (let i of display.oinputs) {
					inputs.push(i); 
				}
	
				defaultinputs.push(display.odefaultinput);
				if (!display.blanked) md.blanked = false;
			}
			inputs = inputs.filter(input => {
				let count = 0;
				for (let i of inputs) {
					if (i == input)
						count++;
				}
				return count == displays.length;
			});	
			md.oinputs = Array.from(new Set(inputs)); // only include one of each input
			md.odefaultinput = Array.from(new Set(defaultinputs)).length == 1 ? Array.from(new Set(defaultinputs))[0] : null; 
			md.oaudiodevices = this.getAudioDevices(names);
	
			console.log("md:", md);	
	
			this.selectedDisplay = md;
			this.multipledisplays = true;	
		}
	    setTimeout(() => { this.buildInputMenu(); }, 0)

		// select the default input
		if (this.showing && changeInput) {
			if (this.selectedDisplay.odefaultinput != null) {
				console.log("switching to default input:", this.selectedDisplay.odefaultinput.name);
				this.changeInput(this.selectedDisplay.odefaultinput);
			} else {
				console.log("no default input found. switching to", this.selectedDisplay.oinputs[0].name);
				this.changeInput(this.selectedDisplay.oinputs[0]);
			}
		}

		if (this.dtaMinion) {
		}
  }

  getAudioDevices(names: string[]): AudioOutDevice[] {
	  // find 'most correct' audio configuation
	  let max = 0;
	  let index = 0;
	  for (let ad of this.api.uiconfig.audio) {
		let count = 0;
		for (let d of ad.displays) {
			for (let n of names) {
				if (n == d) 
					count++;
			}
		}
		if (count > max) {
			max = count;
			index = this.api.uiconfig.audio.indexOf(ad);	
		}
	  } 
	  console.log("using audio configuration:", this.api.uiconfig.audio[index]);

	  let devices: AudioOutDevice[] = [];
	  for (let n of this.api.uiconfig.audio[index].audiodevices) {
	 	for (let a of this.audiodevices) {
			if (n == a.name) {
				devices.push(a);
				a.selected = true;
				break;
			} else {
				a.selected = false;	
			}
		} 
	  }

	  return devices;
  }


  getOutputDevice(name: string): OutputDevice {
 	for (let d of this.displays) {
		if (d.name == name)
			return d;
	} 
	console.error("failed to find a display named:", name);
	return null;
  }
  
  getInputDevice(name: string): InputDevice {
	for (let input of this.inputs) {
		if (input.name == name)
			return input;
	} 
	console.error("failed to find an input named:", name);
   	return null;
  } 

  getMic(name: string): Mic {
 	for (let m of this.mics) {
		if (m.name == name)
			return m	
	} 
	console.error("failed to find a mic named:", name);
   	return null;
  }

  getAudioDevice(name: string): AudioOutDevice {
 	for (let a of this.audiodevices) {
		if (a.name == name) {
			return a;	
		}	
	} 
	console.error("failed to find an audio device named:", name);
   	return null;
  }

  setupFeatures() {
	for (let feature of this.api.uiconfig.features) {
		// todo enable features
		switch(feature) {
			case 'display-to-all':
				console.log("Enabling feature:", feature);
				this.displaytoall = true;
				break;
			case 'power-off-all':
				this.poweroffall = true;
				console.log("Enabling feature:", feature);
				break;
			case 'group-input':
				console.log("Enabling feature:", feature);
				break;
			default: 
				console.error("unknown feature:", feature);
				break;	
		}
	}
  }

  // build the input menu
  buildInputMenu() {
//    console.log("ring:", this.ring);
    let numOfChildren = this.ring.nativeElement.childElementCount;
//    console.log("num of children:", numOfChildren);
    let children = this.ring.nativeElement.children;
    let angle = (360 - this.TITLE_ANGLE) / (numOfChildren - 1);
//    console.log("angle", angle);
    // svg arc length 
    this.arcpath = this.getArc(.5, .5, .5, 0, angle);
	this.titlearcpath = this.getArc(.5, .5, .5, 0, this.TITLE_ANGLE);

	// apply styles to first two (title area)
//    console.log("title slice:", children[0]);	

    let rotate = "rotate(" + String(-(this.TITLE_ANGLE_ROTATE)) + "deg)";
    children[0].style.transform = rotate;

    // apply styles to children
    for (let i = 1; i < numOfChildren; i++) {
//      console.log("children[" + i + "]", children[i]);

      // rotate the slice
      let rotate = "rotate(" + String((angle * -i) - (this.TITLE_ANGLE_ROTATE)) + "deg)";
      children[i].style.transform = rotate;
	  // rotate the text
      rotate = "rotate(" + String((angle * i) + this.TITLE_ANGLE_ROTATE) + "deg)";
	  children[i].firstElementChild.style.transform = rotate; 
    }

	this.getInputOffset();
  }

  getArc(x, y, radius, startAngle, endAngle) {
    let start = this.polarToCart(x, y, radius, endAngle);
    let end = this.polarToCart(x, y, radius, startAngle);

    let largeArc = endAngle - startAngle <= 180 ? "0" : "1";

    let d = [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArc, 0, end.x, end.y,
      "L", x, y,
      "L", start.x, start.y
    ].join(" ");
    return d;
  }

  polarToCart(cx, cy, r, angle) {
    let angleInRad = (angle - 90) * Math.PI / 180.0;

    return {
      x: cx + (r * Math.cos(angleInRad)),
      y: cy + (r * Math.sin(angleInRad))
    };
  }

  getInputOffset() {
	 let numOfInputs = this.ring.nativeElement.childElementCount - 1;
     let total = (numOfInputs * 1) + 24;

	 let Nright = ((numOfInputs - 1) * total) / numOfInputs;
	 let Ntop = Nright / (numOfInputs - 1);

   switch(numOfInputs) {
	case 4:
		Nright = 22.5;
		Ntop = 9;
		break;
	case 3:
		Nright = 16;
		Ntop = 13;
	   	break;
	case 2:
		Nright = 10;
		Ntop = 26;
	   	break;
	case 1:
		Nright = 15;
		Ntop = 64;
		break;	
   }
  
	 this.rightoffset = String(Nright) + "%";
//	 console.log("right offset:", this.rightoffset);
	 this.topoffset = String(Ntop) + "%";
//	 console.log("top offset:", this.topoffset);
  }

  updateUI(e: Event) {
    console.log("update ui based on event:", e);

	if (this.dtaMinion && (e.device == "dta" || e.device == this.dtaMasterHost)) {
		switch(e.eventInfoKey) {
			case "input":
				// if the currect selected input is the 'dta' input
				if (this.selectedDisplay.oinput.displayname == this.dtaMasterHost) {
					let i = this.getInputDevice(e.eventInfoValue);
					i.name = e.eventInfoValue;
				   	var body = { displays: [] }
				   	for (let display of this.displays) {
				    	body.displays.push({
				      		"name": display.name,
				      		"input": e.eventInfoValue,
				     	});
				   	}
					console.log("[DTA] Changing input", body);
				   	this.put(body, func => {}, err => this.notify.error("DTA Error", "Failed to change minion input"));

					i = this.getInputDevice(this.dtaMasterHost);
					if (i != null) this.selectedDisplay.oinput = i;
				} 

				for (let input of this.selectedDisplay.oinputs) {
					if (input.displayname == this.dtaMasterHost) {
						input.name = e.eventInfoValue;	
						console.log("change", input, "to have name", e.eventInfoValue);
					}	
				}
				break;
			case "blanked": 
				body = { displays: [] }	
				for (let display of this.displays) {
					body.displays.push({
						"name": display.name,
						"blanked": (e.eventInfoValue == 'true')	
					})
				}
				this.put(body, func => {}, err => this.notify.error("DTA Error", "Failed to set minion blank"));
				break;
			case "dta":
				this.dtaMinion = (e.eventInfoValue == 'true');  
				if (!this.dtaMinion) {
					this.removeDTAInput(true);
				} else {
					// a different has become master.
					// needs at least 3 panels in the room to ever happen!!!
					for (let input of this.selectedDisplay.oinputs) {
						if (input.displayname == this.dtaMasterHost) {
							input.name = e.eventInfoValue;	
							console.log("change", input, "to have name", e.eventInfoValue);
						}
					}

					if (this.selectedDisplay.oinput.displayname == this.dtaMasterHost) {
						// change input now if the group input is selected		
				   		var body = { displays: [] }
				   		for (let display of this.displays) {
							if (display.selected) {
                                //we're now being asked to turn on the display when display all happens.
				  	  			body.displays.push({
                                    "power": "on",
				   		   			"name": display.name,
				      				"input": e.eventInfoValue,
				     			});
							}
				   		}
						console.log("[DTA] Changing input", body);
				   		this.put(body, func => {}, err => this.notify.error("DTA Error", "Failed to change minion input"));
					}
				}
				break;
			default: 
	       	 	console.error("unknown eventInfoKey:", e.eventInfoKey);
	        	break;
		}
	} else if (this.dtaMinion && e.device != "dta") {
		// stuff to do while you are a minion and recieve an event, but it isn't from the master panel
		// mostly general updating of the ui?
		switch (e.eventInfoKey) {
			case "blanked":
				let d = this.getOutputDevice(e.device)
				if( d != null) {
					d.blanked = (e.eventInfoValue == 'true');
		  			this.updateBlanked();
				}
				break;
			default: 
//				console.error("nothing to do i guess");
				break;
		}

	} else {
	    switch (e.eventInfoKey) {
	      case "input":
			  	let od = this.getOutputDevice(e.device);
				let i  = this.getInputDevice(e.eventInfoValue);
				if (i != null && od != null) od.oinput = i;
	        break;
	      case "power":
			if (this.getOutputDevice(e.device) != null) {
	 	       if (e.eventInfoValue == "on") {
	 	         this.showing = true;
	 	         this.startSpinning = false;
	 	       } else {
	 	         this.showing = false;
	 	       }
		  	}
	        break;
	      case "volume":
			let vd = this.getAudioDevice(e.device) 
		  	if (vd != null) {
				vd.volume = Number(e.eventInfoValue);
				vd.muted = false;
			} else {
				let m = this.getMic(e.device)
				if (m != null) {
					m.volume = Number(e.eventInfoValue);
					m.muted = false;	
				}
			}
	        break;
	      case "muted":
			let md = this.getAudioDevice(e.device);
		  	if (md != null) md.muted = (e.eventInfoValue == 'true');
			else {
				let m = this.getMic(e.device)
				if (m != null) {
					m.muted = (e.eventInfoValue == 'true');	
				}
			}
	        break;
	      case "blanked":
			let d = this.getOutputDevice(e.device)
			if( d != null) {
				d.blanked = (e.eventInfoValue == 'true');
		  		this.updateBlanked();
			}
	        break;
		  case "dta":
			this.dtaMinion = (e.eventInfoValue == 'true');  
		  	this.dtaMasterHost = e.device;
			// case for if one slice already exists
			// so you wouldn't recreate one in that case, just change it's display name

			if (this.dtaMinion) {
				// becoming a minion
                this.showing = true
				let body = { displays: [], audioDevices: [] };
				for (let display of this.displays) {
					body.displays.push({
                        "power": "on",
						"name": display.name,
						"blanked": false,	
					});
					for (let ad of display.oaudiodevices) {
						body.audioDevices.push({
                            "power": "on",
							"name": ad.name,
							"muted": true	
						})	
					}
				}
				console.log("[DTA] Entering dta mode:", body);
				this.put(body, func => {}, err => this.notify.error("DTA Error", "Failed to enter DTA mode"));

				let i = new InputDevice();
				i.name = this.dtaMasterHost;
				i.displayname =  this.dtaMasterHost;
				i.icon = "people";
				this.inputs.push(i);

				let names: string[] = [];
				for (d of this.displays) {
					if (d.selected) {
						d.oinputs.push(this.getInputDevice(this.dtaMasterHost));
						names.push(d.name);
					}
				}
				this.changeControl(names, false);

				i = this.getInputDevice(this.dtaMasterHost);
				if (i != null) this.selectedDisplay.oinput = i;
				this.dtaMaster = false;
			} else {
				this.dtaMinion = false;
				this.removeDTAInput(true);
			}
			break;
	      default:
	        console.error("unknown eventInfoKey:", e.eventInfoKey);
	        break;
	    }
	}
  }

  removeDTAInput(changeInput: boolean) {
	// remove the extra device
	let ii: InputDevice;
	for (let i of this.inputs) {
		if (i.displayname == this.dtaMasterHost) {
			this.inputs.splice(this.inputs.indexOf(i));	
			ii = i;
		}
	}
	this.dtaMasterHost = null;
	let names: string[] = [];
	for (let d of this.displays) {
		if (d.selected) {
			names.push(d.name);
			if (ii != null) d.oinputs.splice(this.inputs.indexOf(ii));
		}
	}
	this.changeControl(names, changeInput);
  }

  hasRole(d: Device, role: string): boolean {
    for (let r of d.roles) {
      if (r == role)
        return true;
    }
    return false;
  }

  //
  // commands
  // 
  enterScreen() {
    if (this.sendingOn || this.selectedDisplay.oaudiodevices == null) {
        if (this.sendingOn) {
          this.debugmessage("Already sending the power-on request");
        }
        if (this.selectedDisplay.oaudiodevices == null) {
          console.log("Yo, no devices")
          this.debugmessage("Oaudiodevices was null");
          this.api.getJSON().subscribe(data => {
            Object.assign(this.api.uiconfig, data);
            console.log("uiconfig", this.api.uiconfig);
            this.api.loaded.next(true);
          });
        }
      return;
    }
  	
    this.sendingOn = true;
    this.startSpinning = true;
	this.displayselection = false;
	let body = { displays: [], audioDevices: [] }
	for (let display of this.displays) {
		body.displays.push({
			"name": display.name,
      		"power": "on",
      		"blanked": false,
			"input": display.odefaultinput.name
		});	
	}

	for (let ad of this.selectedDisplay.oaudiodevices) {
		if (this.dtaMinion) {
			body.audioDevices.push({
				"name": ad.name,
				"muted": true,
				"volume": 30
			});
		
		} else {
			body.audioDevices.push({
				"name": ad.name,
				"muted": false,
				"volume": 30
			});
		}
	}

    this.put(body, func => {}, err => this.notify.error("Error", "Failed turn on room"), after => {
        this.debugmessage("Entering.");
//      this.updateState();
	  // need to updateState when turning on display
      this.showing = true;
      this.startSpinning = false;
      this.sendingOn = false;
    });

	for (let display of this.displays) {
		display.blanked = false;
		display.oinput = display.odefaultinput;
	}
  }

  toggleMute() {
    var body = { audioDevices: [] }
    for (let a of this.selectedDisplay.oaudiodevices) {
      if (a.selected) {
	  	a.muted = !a.muted;
        body.audioDevices.push({
          "name": a.name,
          "muted": a.muted 
        });
      }
    }
    this.put(body, func => {}, err => this.notify.error("Error", "Failed to toggle mute"));
  }

  isMuted(): boolean {
	// null case
	if (!this.selectedDisplay.oaudiodevices)
		return

 	for (let a of this.selectedDisplay.oaudiodevices) {
		if (a.muted) return true;
	} 
	return false;
  }


  powerOff() {
	if (this.dtaMaster) {
		this.toggleDisplayToAll();	
	}

	let body = { displays: [] }
	for (let display of this.displays) {
		body.displays.push({
			"name": display.name,
      		"power": "standby",
		});	
	}
    this.put(body, func => {}, err => { this.notify.error("Error", "Failed to turn off devices"); this.showing = !this.showing; });
    this.showing = !this.showing;
  }

  changeVolume(volume: number) {
	this.lastvolume = volume;
    var body = { audioDevices: [] }
    for (let a of this.selectedDisplay.oaudiodevices) {
      if (a.selected) {
        body.audioDevices.push({
          "name": a.name,
          "volume": volume 
        });
      }
    }
    this.put(body, func => {}, err => { this.notify.error("Error", "Failed to change volume") });
  }

  lastvolume: number = 0;
  updateVolume(volume: number) {
	let total = volume - this.lastvolume;
	if (total > 10 || total < -10) {
		this.changeVolume(volume);
	}
  } 

  volumeLevel(): number {
 	// null case 
	if (!this.selectedDisplay.oaudiodevices)
		return 

	let total = 0;
	for (let a of this.selectedDisplay.oaudiodevices) {
		total += a.volume;
	}
	return total / this.selectedDisplay.oaudiodevices.length;
  }

  changeMicVolume(volume: number, name: string) {
 	let body = { audioDevices: [] };
	body.audioDevices.push({
		"name": name,
		"volume": volume	
	});
	
	this.put(body, func => {}, err => this.notify.error("Error", "Failed to change mic volume"));
  }

  toggleMicMute(name: string) {
 	let body = { audioDevices: [] };
	for (let m of this.mics) {
		if (m.name == name) {
			m.muted = !m.muted;
   			body.audioDevices.push({
				"name": m.name,
				"muted": m.muted	
			});
		}	
	}
	this.put(body, func => {}, err => this.notify.error("Error", "Failed to mute mic"));
  }

  toggleBlank() {
    var body = { displays: [] }
    for (let display of this.displays) {
      if (display.selected) {
        display.blanked = !display.blanked;
        body.displays.push({
          "name": display.name,
          "blanked": display.blanked 
        });
     }
    }
    this.put(body, func => {}, err => this.notify.error("Error", "Failed to toggle blank"));
	this.updateBlanked();

	if (this.dtaMaster) {
		let event = {
			"device": "dta",
			"eventinfokey": "blanked",
			"eventinfovalue": String(this.selectedDisplay.blanked)
		}
 		this.api.publishFeature(event)
	}
  }

  setBlank(status: boolean) {
    var body = { displays: [] }
    for (let display of this.displays) {
      if (display.selected) {
        display.blanked = status;
        body.displays.push({
          "name": display.name,
          "blanked": status
        });
     }
    }
    this.put(body, func => {}, err => this.notify.error("Error", "Failed to set blank to " + status));
	this.updateBlanked();

	if (this.dtaMaster) {
		let event = {
			"device": "dta",
			"eventinfokey": "blanked",
			"eventinfovalue": String(this.selectedDisplay.blanked)
		}
 		this.api.publishFeature(event)
	}
  }

  updateBlanked() {
	for (let display of this.displays) {
		if (display.selected) {
			this.selectedDisplay.blanked = display.blanked ? true : false;			
			if (this.selectedDisplay.blanked) break;
		}	
	}
  }

  changeInput(i: InputDevice) {
	if (this.dtaMaster) {
		let event = {
			"device": "dta",
			"eventinfokey": "input",
			"eventinfovalue": i.name	
		}
 		this.api.publishFeature(event)
	} else if (this.dtaMinion) {
		this.dtaMinion = false;
	} else if (i.displayname == this.dtaMasterHost) {
		this.dtaMinion = true;	
	}

    let body = { displays: [], audioDevices: [] }
    for (let display of this.displays) {
      if (display.selected) {
        body.displays.push({
          "name": display.name,
          "input": i.name,
        });
      }
    }

	// this is the problem with the change input video switcher (?) ce
	// can't change the audioInput in the audioDisplays array
	if (!this.dtaMinion) {
		for (let a of this.selectedDisplay.oaudiodevices) {
			if (a.selected) {
				body.audioDevices.push({
					"name": a.name,
					"input": i.name	
				})	
			}		
		}
	}

    this.put(body, func => {}, err => {this.notify.error("Error", "Failed to change input")});

	this.selectedDisplay.oinput = i;
  }


//Toggle DTA
  sendingDTA: boolean;
  dtaMaster: boolean;
  dtaMasterHost: string;
  dtaMinion: boolean;
  toggleDisplayToAll() {
	if (this.sendingDTA)
		return;	

	this.sendingDTA = true;
    setTimeout(() => { this.sendingDTA = false }, 1000); //milliseconds of button timeout

	this.dtaMaster = !this.dtaMaster;

	if (this.dtaMaster && this.dtaMasterHost != this.api.hostname) {
		this.removeDTAInput(true);
	}
	
	let event = {
		"device": this.api.hostname,
		"eventinfokey": "dta",
		"eventinfovalue": String(this.dtaMaster) 
	}
 	this.api.publishFeature(event)

	if (this.dtaMaster) {
		event = {
			"device": "dta",
			"eventinfokey": "input",
			"eventinfovalue": this.selectedDisplay.oinput.name	
		}
	 	this.api.publishFeature(event)

		// mute current audio out device
	    var body = { audioDevices: [] }
	    for (let a of this.selectedDisplay.oaudiodevices) {
	      if (a.selected) {
	        body.audioDevices.push({
	          "name": a.name,
	          "muted": true 
	        });
	      }
	    }
	    this.put(body, func => {}, err => this.notify.error("DTA Error", "Failed to mute current audio out device"));

		// switch to room audio
		let index = 0;
		for (let ac of this.api.uiconfig.audio) {
			if (ac.displays.includes("dta")) index = this.api.uiconfig.audio.indexOf(ac);
		}	
	
		let devices: AudioOutDevice[] = [];
		for (let n of this.api.uiconfig.audio[index].audiodevices) {
		 	for (let a of this.audiodevices) {
				if (n == a.name) {
					devices.push(a);
					a.selected = true;
					break;
				} else {
					a.selected = false;	
				}
		 	}
		}
		
		// set room audio level, and input
		this.selectedDisplay.oaudiodevices = devices;
	    for (let a of this.selectedDisplay.oaudiodevices) {
	      if (a.selected) {
	        body.audioDevices.push({
	          "name": a.name,
	          "muted": false,
			  "volume": 30,
			  "input": this.selectedDisplay.oinput.name 
	        });
	      }
	    }
	    this.put(body, func => {}, err => this.notify.error("DTA Error", "Failed to set room audio level and input"));
		console.log("Switch to room audio. Using audio configuration:", devices);
	} else {
		// mute room audio
	    let body = { audioDevices: [] }
	    for (let a of this.selectedDisplay.oaudiodevices) {
	      if (a.selected) {
	        body.audioDevices.push({
	          "name": a.name,
//              "muted": false 
	          "muted": true 
	        });
	      }
	    }
		this.put(body, func => {}, err => this.notify.error("DTA Error", "Failed to mute room audio"));

		// switch back to normal audio
		let names: string[] = [];			
		for (let d of this.displays) {
			if (d.selected) {
				names.push(d.name);	
			}
		}
		this.selectedDisplay.oaudiodevices = this.getAudioDevices(names);

	    body = { audioDevices: [] }
	    for (let a of this.selectedDisplay.oaudiodevices) {
	      if (a.selected) {
	        body.audioDevices.push({
	          "name": a.name,
	          "muted": true,
			  "volume": 30,
			  "input": this.selectedDisplay.odefaultinput.name 
	        });
	      }
	    }
	    this.put(body, func => {}, err => this.notify.error("DTA Error", "Failed to switch back to normal audio"));
	}
  }

  buttonpress(name: string) {
    let event = {
      "eventinfokey": "buttonpress",
      "eventinfovalue": name
    }

    this.api.publish(event);
  }

  debugmessage(value: string) {
    let event = {
      "eventinfokey": "DEBUG",
      "eventinfovalue": value
    }

    this.api.publish(event);

  }


  man1: boolean;
  man2: boolean;
  man3: boolean;
  management(n: number) {
    switch (n) {
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
          console.log("defcon 1. showing management console.");
          this.man1 = false;
          this.man2 = false;
          this.man3 = false;
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

  refresh() {
    console.log("refreshing page...");
    location.reload();
  }

  deviceInfo: any;
  deviceinfo() {
    this.api.getDeviceInfo().subscribe(data => {
      console.log("deviceinfo:", data);
      Object.assign(this.deviceInfo, data);
    })
  }

  dockerStatus: any;
  dockerstatus() {
    this.api.getDockerStatus().subscribe(data => {
      console.log("dockerstatus:", data);
	  this.dockerStatus = data;
    })
  }

  reboot() {
    console.log("rebooting");
    this.api.reboot().subscribe();
  }

  goToDisplayControl(names: string[]) {
	if (names[0] == 'all') {
		names = [];
		for (let dd of this.displays) {
			names.push(dd.name);	
		}
	}
	this.changeControl(names, true);
	this.displayselection = false;
  }

  goToDisplaySelection() {
 	console.log("going to display selection") 

	this.ringopen = false;
	this.displayselection = true;
  }

  help(s: String) {
	console.log("help called:", s);
	this.helprequested = true;
    setTimeout(() => { this.helprequested = false }, 20000); //milliseconds of button timeout
	let body = {
		"building": this.api.building,
		"room": this.api.room	
	};
 	this.api.postHelp(body, s).subscribe(data => {
		console.log("data:", data);	
	}); 
  }
  
  powerOffAll() {
	if (this.dtaMaster) {
		this.toggleDisplayToAll();	
	}

	let body = { 
  		"power": "standby" 
	}

    this.put(body, func => {}, err => { this.notify.error("Error", "Failed to turn power off on all displays"); this.showing = !this.showing; });
    this.showing = !this.showing;
  }

  @ViewChild("resetviamodal") resetviamodal: ModalComponent;
  longPressInput(i) {
	for (let ii of this.room.config.devices) {
		if (i.name == ii.name) {
			switch(ii.type){
			case "via":
				this.resetviamodal.info = ii.address;
				this.resetviamodal.show();
				console.log("via", this.resetviamodal);
				break;
			default:
				break;
			}
		}
	}
  }

  via(command: string) {
	  let address = this.api.baseurl + ":8014/via/" + this.resetviamodal.info + "/" + command;
	  console.log("sending command", command, "to via at", address);
	  this.api.get(address).subscribe(data => {});
  }

  notificationDestroy(e) {
 //	console.log("event", e); 
	// decide if it was clicked
  }

  toDashboard() {
 	window.location.assign("http://" + location.hostname + ":10000/dash");
  }
} 
