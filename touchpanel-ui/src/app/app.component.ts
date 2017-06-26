import { Component, OnInit, OnDestroy, trigger, transition, style, animate, state, ViewChild, ElementRef } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService, CookieOptions } from 'ngx-cookie';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus, Event, Device, DeviceData, icons, cookies } from './objects';
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
  messages: Array<any>;
  events: Array<Event>;
  // room data
  room: Room;
  roomname: string;
  // display information	
  volume: number;
  muted: boolean;
  inputs: Array<DeviceData>;
  inputsToShow: Array<DeviceData>;
  displays: Array<DeviceData>;
  displaysToShow: Array<DeviceData>;
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
  currentInput: DeviceData;
  selectedDisplay: DeviceData; 
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
	this.inputsToShow = [];
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
	this.readToShowCookies();
	this.currentInput = new DeviceData(); 
	this.selectedDisplay = new DeviceData();
    this.api.setup();
    this.getData();
	this.blanked = true;
	this.helprequested = false;
	
	// uncomment for local testing
//   this.showing = true;
//	this.microphone = true;
//	this.microphonecontrol = true;

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

        for (let d of this.room.config.devices) {
          if (this.hasRole(d, 'VideoIn'))
            this.createInputDeviceData(d);
        }

        this.getInputs();
        this.statusUpdateVolume();
        setTimeout(() => { this.checkEmpty(); }, 0)
        setTimeout(() => { this.buildInputMenu(); }, 0)
      });
    });
  }

  //we need to allow for the case that the display is off, in which case it's status will come back with a blank input
  getInputs() {
    for (let display of this.room.status.displays) {
      var hasinput = false;
      for (let input of this.inputs) {
        if (display.input == input.name) { // find where the display's input matches an input
          console.log("display", display.name, "has input", input.name);
          let dd = new DeviceData();
          dd.name = display.name;
          dd.icon = input.icon;

          //everything is selected by default;
          dd.selected = true;
          this.displays.push(dd);
          hasinput = true;
        }
      }
      if (!hasinput) {
        let dd = new DeviceData();
        dd.name = display.name;
        dd.icon = icons.blanked;
        //everything is selected by default
        dd.selected = true;
        this.displays.push(dd);
      }
    }

    // set the display names
    for (let display of this.displays) { // maybe this.displays?
      for (let device of this.room.config.devices) {
        if (display.name == device.name) {
          display.displayName = device.display_name;
          console.log("set display", display.name, "to have display name of", display.displayName);
        }
      }
    }
	
	this.syncDisplayArrays();
  }

  syncDisplayArrays() {
	// update info in this.displaysToShow with info in this.displays
	console.log("syncing display objects");
	for (let ds of this.displaysToShow) {
		for (let d of this.displays) {
			if (ds.name == d.name) {
				console.log("syncing", ds, "from displaysToShow with", d, "from displays");
				ds.displayName = (d.displayName) ? d.displayName : "";
				ds.input = (d.input) ? d.input : this.inputsToShow[0].name;
				ds.selected = (d.selected) ? d.selected : true;
				ds.icon = (d.icon && (d.icon != icons.blanked)) ? d.icon : this.inputsToShow[0].icon;
				ds.blanked = (d.blanked) ? d.blanked : true;
			}		
		}
	}

  }

  checkEmpty() {
	// if the toShow arrays are empty, fill them will everything
	if (this.displaysToShow.length == 0) {
		console.log("displays to show is empty, filling it...");
		for (let d of this.displays) {
			this.displaysToShow.push(d);	
		}
		console.log("done.", this.displaysToShow);
	}
	if (this.inputsToShow.length == 0) {
		console.log("inputs to show is empty, filling it...");
		for (let d of this.inputs) {
			this.inputsToShow.push(d);	
		}
		console.log("done.", this.inputsToShow);
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

      let darkenstr = "#455A64";
      children[i].style.backgroundColor = darkenstr;
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

      // color it
//		different color for each slice
//      let darkenstr = "hsl(193, 76%, " + String(80 - (i * 5)) + "%)";
	  // single color for each slice
	  let darkenstr = "#90A4AE";
      children[i].style.backgroundColor = darkenstr;
    }
	// start out all control mode
	if (this.displaysToShow.length == 1) {
		console.log("only one display");	
		this.multipledisplays = false;
		this.goToSingleControl(this.displaysToShow[0]);
	} else {
		this.multipledisplays = true;
		this.goToSingleControl('all');
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
 	 let total = (this.inputsToShow.length * 2) + 24;	 

	 let Nright = ((this.inputsToShow.length - 1) * total) / (this.inputsToShow.length);
	 let Ntop = Nright / (this.inputsToShow.length - 1);

	 if (this.inputsToShow.length == 2 || this.inputsToShow.length == 3) {
		Nright++;
	 } else if (this.inputsToShow.length == 1) {
		Nright = 10;
		Ntop = 21;
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
            input = i;
            break;
          }
        }

        for (let display of this.displaysToShow) {
          if (display.name == e.device) {
            display.icon = input.icon;
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
            d = display;
            break;
          }
        }

		console.log("device", d);

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
              d.icon = input.icon;
            }
          }
        }
      }
    }

	this.syncDisplayArrays();
  }

  createInputDeviceData(d: Device) {
    let dd = new DeviceData();
    dd.name = d.name;
    dd.displayName = d.display_name;
    switch (d.type) {
      case "hdmiin":
        dd.icon = icons.hdmi;
        break;
      case "overflow":
        dd.icon = icons.overflow;
        break;
      case "computer":
        dd.icon = icons.computer;
        break;
      case "iptv":
        dd.icon = icons.iptv;
        break;
      case "appletv":
        dd.icon = icons.appletv;
        break;
      case "table":
        dd.icon = icons.table;
        break;
      default:
        dd.icon = icons.generic;
        break;
    }
    this.inputs.push(dd);

    console.log("added", dd.name, "of type", d.type, "to inputs. (icon = " + dd.icon + " )");
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
	let body = { displays: [] }
	for (let display of this.displaysToShow) {
		body.displays.push({
			"name": display.name,
      		"power": "on",
      		"blanked": true,
			"input": this.inputsToShow[0].name
		});	
	}

    this.put(body, func => { }, func => { }, after => {
      this.updateState();
      this.showing = true;
      this.startSpinning = false;
      this.sendingOn = false;
    });
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

  setOutputDevice(d: DeviceData) {
    d.selected = !d.selected;
  }

  switchInput(d: DeviceData) {
    var body = { displays: [] }
    for (let display of this.displaysToShow) {
      if (display.selected) {
        display.icon = d.icon;
		display.input = d.name;	// for appearances? faster (click)?
        body.displays.push({
          "name": display.name,
          "input": d.name,
        });
      }
    }
    this.put(body);
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
			"input": this.inputsToShow[0].name,
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

  openring() {
	this.ringopen = !this.ringopen;
	console.log("ringopen:", this.ringopen);
  }

  goToSingleControl(d) {
	if (d == 'all') {
		console.log("going to all control");	
    	for (let display of this.displaysToShow) {
			display.selected = true;
		}
		this.selectedDisplay = this.displaysToShow[0];
		this.displaysToShow[0].input = "";
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

  requestHelp() {
	this.helprequested = true;
	console.log("help requested");
	let body = {
		"building": this.api.building,
		"room": this.api.room	
	}
 	this.api.postHelp(body).subscribe(data => {
		console.log("data:", data);	
	}) 
  }


  // stuff for displays to show/ inputs to show

  isInDisplaysToShow(d): boolean {
	for (let x of this.displaysToShow) {
		if (d.name == x.name) {
			return true;
		}	
	}
	return false;
  }

  toggleDisplayToShow(d: DeviceData) {
	if (this.isInDisplaysToShow(d)) {
 		console.log("removing from displaysToShow:", d); 
		this.displaysToShow.splice(this.displaysToShow.indexOf(d), 1);
	} else {
 		console.log("adding to displaysToShow:", d); 
		this.displaysToShow.push(d);
	}
  }

  isInInputsToShow(d): boolean {
	for (let x of this.inputsToShow) {
		if (d.name == x.name) {
			return true;
		}	
	}
	return false;
  }

  toggleInputToShow(d: DeviceData) {
	if (this.isInInputsToShow(d)) {
 		console.log("removing from inputsToShow:", d); 
		this.inputsToShow.splice(this.inputsToShow.indexOf(d), 1);
	} else {
 		console.log("adding to inputsToShow:", d); 
		this.inputsToShow.push(d);
	}
  }

  // extra features
  displayToAll: boolean;
  isExtraFeatureOn(s: String): boolean {
 	switch (s) {
	case 'dta':
		return this.displayToAll;
	} 
  }

  toggleExtraFeatures(s: String) {
 	switch (s) {
	case 'dta':
		this.displayToAll = !this.displayToAll;	
		break;
	} 
  }

  createToShowCookies() {
	// get a date 20 years away.
	// IN 20 YEARS AFTER SETTING, SOMEONE WILL HAVE TO REDO THEM
	let date = new Date(new Date().setFullYear(new Date().getFullYear() + 20));
	console.log("date", date);
	let co: CookieOptions = {expires: date};
	this.cookie.putObject(cookies.inputs, this.inputsToShow, co);
	this.cookie.putObject(cookies.displays, this.displaysToShow, co);
	this.cookie.putObject(cookies.dta, this.displayToAll, co);
	this.refresh();
  }

  readToShowCookies() {
	let i = new Array<Object>();
	let d = new Array<Object>();
	Object.assign(i, this.cookie.getObject(cookies.inputs));
	Object.assign(d, this.cookie.getObject(cookies.displays));
	let c: DeviceData;
	for (let x of i) {
		c = new DeviceData();
		Object.assign(c, x); 
		this.inputsToShow.push(c);
	}
	
	for (let x of d) {
		c = new DeviceData();
		Object.assign(c, x); 
		this.displaysToShow.push(c);
	}

	this.displayToAll = (this.cookie.get(cookies.dta) == 'true');

	console.log("displaysToShow from cookies:", this.displaysToShow);
	console.log("inputsToShow from cookies:", this.inputsToShow);
	console.log("displayToAll from cookies:", this.displayToAll);
  }

  clearToShow() {
	  this.displaysToShow.length = 0;
	  this.inputsToShow.length = 0;
  }

  deleteCookies() {
	console.log("deleting all cookies");
	this.cookie.removeAll();
	this.refresh();
  }
} 
