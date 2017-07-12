import { Component, OnInit, OnDestroy, trigger, transition, style, animate, state, ViewChild, ElementRef } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService, CookieOptions } from 'ngx-cookie';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus, Event, Device, DeviceData, OutputDevice, icons, InputDevice, AudioOutDevice, AudioConfig } from './objects';
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
  // events
  messages: Array<any>;
  events: Array<Event>;
  // room data
  room: Room;
  roomname: string;
  // display information	
  inputs: Array<InputDevice>;
  displays: Array<OutputDevice>;
  audiodevices: Array<AudioOutDevice>;
  powerState: boolean;
  // "lock" screen
  showing: boolean
  currentAudioLevel: number;
  startSpinning: boolean;
  sendingOn: boolean;
  // circle stuff
  @ViewChild('ring') ring: ElementRef;
  arcpath: string;
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

  public constructor(private socket: SocketService, private api: APIService, private cookie: CookieService) {
    this.messages = [];
    this.events = [];
    this.inputs = [];
    this.displays = [];
	this.audiodevices = [];
    this.showing = false;
    this.startSpinning = false;
    this.sendingOn = false;
	this.ringopen = false;

    // management
    this.deviceInfo = new Object();
    this.dockerStatus = new Object();
  }

  public ngOnInit() {
	this.selectedDisplay = new OutputDevice();
    this.api.setup();
    this.getData();
	this.helprequested = false;
	this.displayselection = false;
	
	// uncomment for local testing
//   this.showing = true;
//	this.microphone = true;

    // setup socket to recieve events
    this.socket.getEventListener().subscribe(event => {
      if (event.type == MESSAGE) {
        let data = JSON.parse(event.data.data);

        let e = new Event();
        Object.assign(e, data);
        this.events.push(e);

        // do stuff with event
        this.updateUI(e);
      } else if (event.type == CLOSE) {
        this.messages.push("The socket connection has been closed");
      } else if (event.type == OPEN) {
        this.messages.push("The socket connection has been opened");
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

    this.api.loaded.subscribe(data => {
	  this.roomname = this.api.building + " " + this.api.room;
      this.api.getRoomConfig().subscribe(data => {
        this.room.config = new RoomConfiguration();
        Object.assign(this.room.config, data);
        console.log("roomconfig:", this.room.config);
      });

      this.api.getRoomStatus().subscribe(data => {
        this.room.status = new RoomStatus();
        Object.assign(this.room.status, data);
        console.log("roomstatus:", this.room.status);

		this.createInputDevices();
        this.createOutputDevices();
		this.setupFeatures(); 
      });
    });
  }

  createInputDevices() {
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
	for (let sdisplay of this.room.status.displays) {
		// create displays?
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
						this.displays.push(d);
					}
				}
			}
		}	
	}

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
	this.audiodevices = Array.from(new Set(this.audiodevices)); // clean up duplicates
	console.log("All audio devices:", this.audiodevices);

	if (this.displays.length == 1) {
		this.multipledisplays = false;
		let arr = [];
		arr.push(this.displays[0].name);
		this.changeControl(arr);
	} else {
		this.multipledisplays = true;
		console.log("Defaulting to controlling all displays and their associated audio devices");
		let all = [];
		for (let d of this.displays) {
			all.push(d.name);
		}

		this.changeControl(all);
	}
  }

  changeControl(names: string[]) {
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
		if (this.selectedDisplay.odefaultinput != null) {
			console.log("switching to default input:", this.selectedDisplay.odefaultinput.name);
			this.changeInput(this.selectedDisplay.odefaultinput);
		} else {
			console.log("no default input found. switching to", this.selectedDisplay.oinputs[0].name);
			this.changeInput(this.selectedDisplay.oinputs[0]);
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
				break;
			case 'power-off-all':
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
    console.log("ring:", this.ring);
    let numOfChildren = this.ring.nativeElement.childElementCount;
    console.log("num of children:", numOfChildren);
    let children = this.ring.nativeElement.children;
    let angle = 360 / numOfChildren;
    console.log("angle", angle);
    // svg arc length 
    this.arcpath = this.getArc(.5, .5, .5, 0, angle);

	// apply styles to first two (title area)
	for (let i = 0; i < 2; i++) {
	  console.log("room name slice", i + ":", children[i]);	

      let rotate = "rotate(" + String(angle * -i) + "deg)";
      children[i].style.transform = rotate;
	}

    // apply styles to children
    for (let i = 2; i < numOfChildren; i++) {
      console.log("children[" + i + "]", children[i]);

      // rotate the slice
      let rotate = "rotate(" + String(angle * -i) + "deg)";
      children[i].style.transform = rotate;
	  // rotate the text
      rotate = "rotate(" + String(angle * i) + "deg)";
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
	 let length = this.ring.nativeElement.childElementCount -2;
     let total = (length * 2) + 24;

	 let Nright = ((length - 1) * total) / length;
	 let Ntop = Nright / (length - 1);

   switch(length) {
	case 3:
		Nright++;
	   	break;
	case 2:
		Nright++;
	   	break;
	case 1:
		Nright = 10;
		Ntop = 21;
		break;	
   }
  
	 this.rightoffset = String(Nright) + "%";
	 console.log("right offset:", this.rightoffset);
	 this.topoffset = String(Ntop) + "%";
	 console.log("top offset:", this.topoffset);
  }

  updateUI(e: Event) {
    console.log("update ui based on event:", e);

    switch (e.eventInfoKey) {
      case "input":
	  	  this.selectedDisplay.oinput = this.getInputDevice(e.eventInfoValue); 
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
		let ad = this.getAudioDevice(e.device) 
		ad.volume = Number(e.eventInfoValue);
		ad.muted = false;
        break;
      case "muted":
		this.getAudioDevice(e.device).muted = (e.eventInfoValue == 'true');
        break;
      case "blanked":
		this.getOutputDevice(e.device).blanked = (e.eventInfoValue == 'true');
	  	this.updateBlanked();
        break;
      default:
        console.error("unknown eventInfoKey:", e.eventInfoKey);
        break;
    }
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
    if (this.sendingOn)
      return;
  	
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
		body.audioDevices.push({
			"name": ad.name,
			"muted": false,
			"volume": 30
		})		
	}

    this.put(body, func => { }, func => { }, after => {
//      this.updateState();
	  // need to updateState when turning on display
      this.showing = true;
      this.startSpinning = false;
      this.sendingOn = false;
    });

	for (let display of this.displays) {
		display.blanked = false;
		display.input = display.odefaultinput.name;
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
    this.put(body);
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
	let body = { displays: [] }
	for (let display of this.displays) {
		body.displays.push({
			"name": display.name,
      		"power": "standby",
		});	
	}
    this.put(body, func => { }, err => { this.showing = !this.showing; });
    this.showing = !this.showing;
  }

  changeVolume(volume: number) {
    var body = { audioDevices: [] }
    for (let a of this.selectedDisplay.oaudiodevices) {
      if (a.selected) {
		a.volume = volume;
        body.audioDevices.push({
          "name": a.name,
          "volume": volume
        });
      }
    }
    this.put(body);
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
    this.put(body);
	this.updateBlanked();
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
    var body = { displays: [] }
    for (let display of this.displays) {
      if (display.selected) {
        body.displays.push({
          "name": display.name,
          "input": i.name,
        });
      }
    }
    this.put(body);

	this.selectedDisplay.oinput = i;
  }

  /*
  sendingDTA: boolean;
  sendDisplayToAll() {
	if (this.sendingDTA)
		return;	

	this.sendingDTA = true;
    setTimeout(() => { this.sendingDTA = false }, 5000); //milliseconds of button timeout
	console.log("sending display to all");
 	let body = { displays: [] }
    for (let display of this.displays) {
		body.displays.push({
			"name": display.name,
			"power": "on",
//			"input": this.inputsToShow[0].name,
		  	"blanked": false
		}) // gonna have to find the right input somehow	
	}	
    this.put(body);
  }
 */

  buttonpress(name: string) {
    let event = {
      "eventinfokey": "buttonpress",
      "eventinfovalue": name
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
	this.changeControl(names);
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

  // extra features
  displayToAll: boolean;
  isExtraFeatureOn(s: String): boolean {
 	switch (s) {
	case 'dta':
		return this.displayToAll;
	} 
  }
} 
