import { Component, OnInit, OnDestroy, trigger, transition, style, animate, state } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus, Event, Device, DeviceData, icons, DeviceInfo } from './objects';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
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
    ])
  ]
})
export class AppComponent {
    // event stuff
  messages: Array<any>;
  events: Array<Event>;
  	// room data
  room: Room;
  	// display information	
  volume: number;
  muted: boolean;
  inputs: Array<DeviceData>;
  displays: Array<DeviceData>;
  powerState: boolean;
	// "lock" screen
  showing: boolean
  currentAudioLevel: number;
  startSpinning: boolean;
  sendingOn: boolean;

  public constructor(private socket: SocketService, private api: APIService) {
    this.messages = [];
    this.events = [];
    this.inputs = [];
    this.displays = [];
    this.showing = false;
    this.startSpinning = false;
    this.sendingOn = false;

	// management
	this.deviceInfo = new Object();
	this.dockerStatus = new Object();
  }

  public ngOnInit() {
    this.api.setup();
    this.getData();

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

  put(body: any, success: Function = func => {}, err: Function = func => {}, completed: Function = func => {}): void {
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

  get(url: string, success: Function = func => {}, err: Function = func => {}, completed: Function = func => {}): void {
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
        dd.icon = icons.blanked; //constants for these?
        //everything is selected by default
        dd.selected = true;
        this.displays.push(dd);
      }
    }

	// set the display names
    for (let display of this.displays) {
      for (let device of this.room.config.devices) {
        if (display.name == device.name) {
          display.displayName = device.display_name;
          console.log("set display", display.name, "to have display name of", display.displayName);
        }
      }
    }
  }

  enterScreen() {
    if (this.sendingOn || this.room.status == null)
      return;

    this.sendingOn = true;
    this.startSpinning = true;
    let body = {
      "power": "on",
      "blanked": true
    };

	this.put(body, null, null , after => {
		this.updateState(); // do we need this?
		this.showing = true;
		this.startSpinning = false;
		this.sendingOn = false;
	});
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

        for (let display of this.displays) {
          if (display.name == e.device) {
            if (display.icon == icons.blanked) {
              break;
            }
            display.icon = input.icon;
            display.input = input.name;
            break;
          }
        }
        break;
      case "power":
        if (e.eventInfoValue == "on") {
          this.showing = true;
//          this.updateState();
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
        for (let display of this.displays) {
          if (display.name == e.device) {
            d = display;
            break;
          }
        }

        if (e.eventInfoValue == "true") {
          d.icon = icons.blanked
        }
        else {
          for (let i of this.inputs) {
            if (i.name == d.input) {
              d.icon = i.icon;
              break;
            }
          }
        }
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
//      this.updateInputs();
//		this.statusUpdateVolume(); // only need this, because we will always get a "blanked" event when turning on
							       // if we stop blanking on "power on", then we will have to update the inputs
      }
	);
  }

  statusUpdateVolume() {
    var first = true;
    var count = 0;
    // go through and get the volumes, if only one device is selected, set the current room volume to that level.
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
          this.volume = ((this.volume * count) + speaker.volume) / count + 1
          count++

          if (this.muted && !speaker.muted) {
            this.muted = false;
          }
        }
      }
    }
  }

//  updateInputs() {
//    //go through the list of status and set the current input 
//    for (let display of this.room.status.displays) {
//      for (let d of this.displays) {
//        if (d.icon == icons.blanked) {
//          break;
//        }
//        //check to make sure we map
//        if (d.name == display.name) {
//          //go through and get the device mapping to the input
//          for (let input of this.inputs) {
//            if (input.name == display.input) {
//              d.input = input.name;
//              d.icon = input.icon;
//            }
//          }
//        }
//      }
//    }
//  }

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
      default:
        dd.icon = icons.generic;
        break;
    }
    this.inputs.push(dd);

    console.log("added", dd.name, "of type", dd.icon, "to inputs. (icon = " + dd.icon + " )");
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

    var body = { audioDevices: [] }
    for (let speaker of this.displays) {
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
    let body = {
      "power": "standby"
    };
    this.put(body, null, err => {this.showing = !this.showing;});
    this.showing = !this.showing;
  }

  updateVolume(volume: number) {
    this.volume = volume;

    var body = { audioDevices: [] }
    for (let speaker of this.displays) {
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
    for (let display of this.displays) {
      if (display.selected) {
        display.icon = icons.blanked
        body.displays.push({
          "name": display.name,
          "blanked": true
        });
      }
    }
    this.put(body);
  }

  setOutputDevice(d: DeviceData) {
    d.selected = !d.selected;
  }

  setInputDevice(d: DeviceData) {
    var body = { displays: [] }
    for (let display of this.displays) {
      if (display.selected) {
        display.icon = d.icon;
        display.input = d.name;
        body.displays.push({
          "name": display.name,
          "input": d.name,
          "blanked": false
        });
      }
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
		Object.assign(this.dockerStatus, data);	
	}) 
  }

  reboot() {
	console.log("rebooting");
 	this.api.reboot(); 
  }
} 
