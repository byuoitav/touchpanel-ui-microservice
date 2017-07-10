import { Component, OnInit, OnDestroy, trigger, transition, style, animate, state, ViewChild, ElementRef } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService, CookieOptions } from 'ngx-cookie';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus, Event, Device, DeviceData, OutputDevice, icons, InputDevice } from './objects';
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
  volume: number;
  muted: boolean;
  inputs: Array<InputDevice>;
  displays: Array<DeviceData>; // all displays in room.status
  displaysToShow: Array<OutputDevice>; // all displays from uiconfig
  powerState: boolean;
  blanked: boolean;
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
//  currentInput: DeviceData;
  selectedDisplay: OutputDevice; 
  allcontrol: boolean;
  singlecontrol: boolean;
  // help
  helprequested: boolean;
  // audio data
  microphone: boolean;
  microphonecontrol: boolean;

  public constructor(private socket: SocketService, private api: APIService, private cookie: CookieService) {
    this.messages = [];
    this.events = [];
    this.inputs = [];
	this.displaysToShow = [];
    this.displays = [];
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
	this.blanked = false;
	this.helprequested = false;
	
	// uncomment for local testing
   this.showing = true;
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
		this.setup(); 

        this.statusUpdateVolume();
        setTimeout(() => { this.checkEmpty(); }, 0)
        setTimeout(() => { this.buildInputMenu(); }, 0)
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
				for (let jdisplay of this.api.uiconfig.outputdevices) {
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

						if (this.hasRole(cdisplay, 'AudioOut')) {
//							d.volume = 
//							d.muted = 
						}
						console.log("Created a display to show:", d);
						this.displaysToShow.push(d);
					}
				}
				let d = new OutputDevice();
				// or, is it worth it to create a different kind of struct?
				// everything (at least for now) that is needed for the ui is in displaysToShow. displays is really only (again, for now) in order to send commands to other displays that the UI doesnt appear to know about.

//				this.displays.push(d);
				// create displays array. not displays to show
				// in order to send commands to all the other displays
				// NOTES
				// what do we need out of displays?
				// 		a name
				// 		current input?
				// 		icon?
				// 		blanked/notblanked?, volume?, muted?			
				// 		doesn't need selected (always sending commands, at least with the display to all situation)
				//		probably doesn't need displayname either
				// what data do we need to future proof it the best we can?
			}
		}	
	}
	if (this.displaysToShow.length == 1) {
		this.changeOutputDisplay(this.displaysToShow[0]);	
	}
  }
  
  getInputDevice(name: string): InputDevice {
	for (let input of this.inputs) {
		if (input.name == name) {
			return input;	
		}	
	} 
	console.log("[error] failed to find an input named:", name);
   	return null;
  } 

  setup() {
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
				console.log("unknown feature:", feature);
				break;	
		}
	}
  }

  /*
  syncDisplayArrays() {
	// update info in this.displaysToShow with info in this.displays
	console.log("syncing display objects");
	for (let ds of this.displaysToShow) {
		for (let d of this.displays) {
			if (ds.name == d.name) {
				console.log("syncing", ds, "from displaysToShow with", d, "from displays");
//				ds.displayName = (d.displayName) ? d.displayName : "";
//				ds.input = (d.input) ? d.input : this.inputsToShow[0].name;
				ds.selected = (d.selected) ? d.selected : true;
//				ds.icon = (d.icon && (d.icon != icons.blanked)) ? d.icon : this.inputsToShow[0].icon;
				ds.icon = d.icon;
				ds.blanked = false;
			}
		}
	}
  }
 */

  getDisplayIcon(d): string { 
	console.log("d", d);
	switch(d.type) {	
	case "tv":
		return icons.tv;
	case "sony-projector":
		return icons.projector;
	default:
		return icons.blanked;
	}
  }

  checkEmpty() {
	// if the toShow arrays are empty, fill them will everything
	if (this.displaysToShow.length == 0) {
		console.log("displays to show is empty, filling it...");
		for (let d of this.displays) {
//			this.displaysToShow.push(d);	
		}
//		console.log("done.", this.displaysToShow);
	}
//	if (this.inputsToShow.length == 0) {
//		console.log("inputs to show is empty, filling it...");
//		for (let d of this.inputs) {
//			this.inputsToShow.push(d);	
//		}
//		console.log("done.", this.inputsToShow);
//	}
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

	/*
	// start out all control mode
	if (this.displaysToShow.length == 1) {
		console.log("only one display");	
		this.multipledisplays = false;
		this.goToSingleControl(this.displaysToShow[0]);
	} else {
		this.multipledisplays = true;
		this.goToSingleControl('all');
	}
   */
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
        let input: DeviceData;
        for (let i of this.inputs) {
          if (i.name == e.eventInfoValue) {
//            input = i;
            break;
          }
        }

        for (let display of this.displaysToShow) {
          if (display.name == e.device) {
            display.input = input.name;
            break;
          }
        }
        break;
      case "power":
        if (e.eventInfoValue == "on") {
          this.showing = true;
          this.startSpinning = false;
        } else {
          this.showing = false;
        }
        break;
      case "volume":
        this.muted = false;
        this.volume = Number(e.eventInfoValue);
        break;
      case "muted":
        this.muted = (e.eventInfoValue == 'true');
        break;
      case "blanked":
        var d: DeviceData;

        for (let display of this.displaysToShow) {
          if (display.name == e.device) {
//            d = display;
            break;
          }
        }

        d.blanked = (e.eventInfoValue == 'true');
        break;
	  case "refresh": 
		  console.log("refresh message recieved");
	  	  this.refresh();
		  break;
      default:
        console.log("unknown eventInfoKey:", e.eventInfoKey);
        break;
    }
  }

  updateState() {
    this.api.getRoomStatus().subscribe(
      data => {
        this.room.status = new RoomStatus();
        Object.assign(this.room.status, data);
        console.log("updated state:", this.room.status);
        this.updateInputs();
        this.statusUpdateVolume();
      }
    );
  }

  statusUpdateVolume() {
    var first = true;
    var count = 0;
    // go through and get the volumes, if only one device is selected, set the current room volume to that level.
    // for muted, if all are muted, set the icon to muted, else show it as open.
    for (let speaker of this.room.status.audioDevices) {
      for (let display of this.displaysToShow) {
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
          this.volume = ((this.volume * count) + speaker.volume) / count + 1
          count++

          if (this.muted && !speaker.muted) {
            this.muted = false;
          }
        }
      }
    }
  }

  updateInputs() {
    //go through the list of status and set the current input 
    for (let display of this.room.status.displays) {
      for (let d of this.displaysToShow) {
        if (d.icon == icons.blanked) {
          break;
        }
        //check to make sure we map
        if (d.name == display.name) {
          //go through and get the device mapping to the input
          for (let input of this.inputs) {
            if (input.name == display.input) {
              d.input = input.name;
//              d.icon = input.icon;
            }
          }
        }
      }
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
	let body = { displays: [], audioDevices: [] }
	for (let display of this.displaysToShow) {
		body.displays.push({
			"name": display.name,
      		"power": "on",
      		"blanked": false,
			"input": display.odefaultinput.name
		});	
		body.audioDevices.push({
			"name": display.name,
			"muted": false,
			"volume": 30	
		});
	}

    this.put(body, func => { }, func => { }, after => {
      this.updateState();
      this.showing = true;
      this.startSpinning = false;
      this.sendingOn = false;
    });

	for (let display of this.displaysToShow) {
		display.blanked = false;
		display.input = display.odefaultinput.name; 
		this.muted = false;
	}
  }

  changeOutputDisplay(d) {
 	//todo make something for multiple displays
	this.selectedDisplay = d;	
	this.buildInputMenu();
  }

  toggleMute() {
    if (this.muted)
      this.muted = false;
    else
      this.muted = true;

    var body = { audioDevices: [] }
    for (let speaker of this.displaysToShow) {
      if (speaker.selected) {
        body.audioDevices.push({
          "name": speaker.name,
          "muted": this.muted
        });
      }
    }
    this.put(body);
  }

  powerOff() {
	let body = { displays: [] }
	for (let display of this.displaysToShow) {
		body.displays.push({
			"name": display.name,
      		"power": "standby",
		});	
	}
    this.put(body, func => { }, err => { this.showing = !this.showing; });
    this.showing = !this.showing;
  }

  updateVolume(volume: number) {
    this.volume = volume;
    this.muted = false;

    var body = { audioDevices: [] }
    for (let speaker of this.displaysToShow) {
      if (speaker.selected) {
        body.audioDevices.push({
          "name": speaker.name,
          "volume": this.volume
        });
      }
    }
    this.put(body);
  }

  blank() {
    var body = { displays: [] }
    for (let display of this.displaysToShow) {
      if (display.selected) {
        display.blanked = !display.blanked;
        body.displays.push({
          "name": display.name,
          "blanked": display.blanked 
        });
      }
    }
    this.put(body);
  }

  changeInput(i: InputDevice) {
    var body = { displays: [] }
    for (let display of this.displaysToShow) {
      if (display.selected) {
		display.input = i.name;	// for appearances? faster (click)?
        body.displays.push({
          "name": display.name,
          "input": i.name,
        });
      }
    }
    this.put(body);

	this.selectedDisplay.oinput = i;
  }

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

  goToSingleControl(d) {
	if (d == 'all') {
		console.log("going to all control");	
    	for (let display of this.displaysToShow) {
			display.selected = true;
		}
//		this.selectedDisplay = this.displaysToShow[0];
//		this.displaysToShow[0].input = "";
//		this.switchInput(this.inputsToShow[0]);
	    this.allcontrol = true;
		this.singlecontrol = false;
	} else {
		for (let display of this.displaysToShow) {
			if (d === display) {
				display.selected = true;
			} else {
				display.selected = false;	
			}
		}
		this.selectedDisplay = d;
		this.singlecontrol = true;
		this.allcontrol = false;
	}
	this.displayselection = false;
  }

  goToDisplaySelection() {
 	console.log("going to display selection") 
	this.allcontrol = false;
	this.singlecontrol = false;
	this.ringopen = false;
	this.displayselection = !this.displayselection;
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
