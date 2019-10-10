import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  $WebSocket,
  WebSocketConfig
} from 'angular2-websocket/angular2-websocket';
import { JsonConvert } from 'json2typescript';
import { Device, UIConfig, IOConfiguration, DBRoom, Preset } from '../objects/database';
import { Room, ControlGroup, Display, Input, AudioDevice, AudioGroup, PresentGroup } from '../objects/control';

@Injectable({
  providedIn: 'root'
})
export class BFFService {
  room: Room;
  done: EventEmitter<boolean>;

  constructor() {
    this.done = new EventEmitter();
    // this.room = new Room();
  }

  connectToRoom(controlKey: string) {
    const endpoint = 'ws://' + window.location.hostname + ':88/ws/' + controlKey;
    const ws = new WebSocket(endpoint);

    ws.onmessage = event => {
      console.log('ws event', event);
      this.room = JSON.parse(event.data);
      // this.room = Object.assign(new Room(), JSON.parse(event.data));

      console.log('Websocket data:', this.room);

      this.done.emit(true);
    };

    ws.onerror = event => {
      console.error('Websocket error', event);
    };
  }

  // TODO: everything. Probably stuff with websockets, talking to the BFF, etc.
  // For now I am going to use this service to get the stuff that I need for the screens to work.

  // setupRoom = (roomID: string) => {
  //   this._getDBRoom(roomID).then((answer) => {
  //     this.room = new Room(answer.id, answer.name);

  //     console.log(answer);
  //     console.log(this.room);

  //     this._getInputReachability(roomID).then((ir) => {
  //       this.inputReach = ir;

  //       this._getUIConfig(roomID).then((config) => {
  //         this.room.controlGroups = [];
  //         for (const p of config.presets) {
  //           const cg = new ControlGroup();
  //           cg.id = p.name;
  //           cg.name = p.name;
  //           cg.displays = [];
  //           cg.inputs = [];
  //           cg.audioGroups = [];
  //           cg.presentGroups = [];

  //           this._setupDisplays(cg, answer.devices, p, config);
  //           this._setupInputs(cg, answer.devices, p, config);
  //           this._setupAudioGroups(cg, answer.devices, p, config);
  //           this._setupPresentGroups(cg);
  //           console.log(cg);
  //           this.room.controlGroups.push(cg);
  //         }

  //         this.done.emit(true);
  //       });
  //     });
  //   });
  // }

  // private async _getDBRoom (roomID: string) {
  //   try {
  //     const data = await this.http.get(
  //       this.dbURL + '/rooms/' + roomID,
  //       { headers: this.headers }).toPromise();

  //     const room = this.converter.deserializeObject(data, DBRoom);

  //     return room;
  //   } catch (e) {
  //     throw new Error('error getting the room from the database: ' + e);
  //   }
  // }

  // private async _getUIConfig (roomID: string) {
  //   try {
  //     const data = await this.http.get(
  //       this.dbURL + '/uiconfigs/' + roomID,
  //       { headers: this.headers }).toPromise();

  //     const config = this.converter.deserializeObject(data, UIConfig);

  //     return config;
  //   } catch (e) {
  //     throw new Error('error getting the ui config from the database: ' + e);
  //   }
  // }

  // private async _getInputReachability(roomID: string) {
  //   const roomIDParts = roomID.split('-');
  //   const bID = roomIDParts[0];
  //   const rID = roomIDParts[1];

  //   try {
  //     const data = await this.http.get(
  //       this.apiURL + '/buildings/' + bID + '/rooms/' + rID + '/configuration',
  //       { headers: this.headers }).toPromise();

  //     const room = this.converter.deserializeObject(data, DBRoom);

  //     console.log(room.inputReachability);
  //     return room.inputReachability;
  //   } catch (e) {
  //     throw new Error('error getting the room configuration from the av api: ' + e);
  //   }
  // }

  // private _setupDisplays(conGroup: ControlGroup, deviceList: Device[], preset: Preset, config: UIConfig) {
  //   for (const d of preset.displays) {
  //     const display = new Display();
  //     const device = deviceList.find((a) => {
  //       return a.name === d;
  //     });
  //     const io = config.outputConfiguration.find((a) => {
  //       return a.name === d;
  //     });

  //     display.id = device.id;
  //     display.outputs = [{
  //       name: device.displayName,
  //       icon: io.icon
  //     }];
  //     display.allowedInputs = [];

  //     this.inputReach.forEach((v, k) => {
  //       if (v.includes(d) && !display.allowedInputs.includes(k)) {
  //         display.allowedInputs.push(k);
  //       }
  //     });

  //     conGroup.displays.push(display);
  //   }
  // }

  // private _setupInputs(conGroup: ControlGroup, deviceList: Device[], preset: Preset, config: UIConfig) {
  //   for (const i of preset.inputs) {
  //     const input = new Input();
  //     const device = deviceList.find((a) => {
  //       return a.name === i;
  //     });
  //     const io = config.inputConfiguration.find((a) => {
  //       return a.name === i;
  //     });

  //     input.id = device.id;
  //     input.iconPair = {
  //       name: device.displayName,
  //       icon: io.icon
  //     };
  //     input.subInputs = [];

  //     if (io.subInputs !== undefined && io.subInputs.length > 0) {
  //       for (const subI of io.subInputs) {
  //         const si = new Input();
  //         si.id = subI.name;
  //         si.iconPair = {
  //           name: subI.displayName,
  //           icon: subI.icon
  //         };
  //         input.subInputs.push(si);
  //       }
  //     }

  //     conGroup.inputs.push(input);
  //   }

  //   if (conGroup.id === 'Third' || conGroup.id === 'The Cube') {
  //     conGroup.inputs.push(
  //       {
  //         id: 'ITB-1101-HDMI1',
  //         iconPair: {
  //           name: 'HDMI1',
  //           icon: 'settings_input_hdmi',
  //         },
  //         subInputs: [],
  //         disabled: false
  //       },
  //       {
  //         id: 'ITB-1101-PC1',
  //         iconPair: {
  //           name: 'PC1',
  //         icon: 'desktop_windows',
  //         },
  //         subInputs: [],
  //         disabled: false
  //       },
  //       {
  //         id: 'ITB-1101-PC2',
  //         iconPair: {
  //           name: 'PC2',
  //           icon: 'desktop_windows',
  //         },
  //         subInputs: [],
  //         disabled: false
  //       },
  //       {
  //         id: 'ITB-1101-HDMI2',
  //         iconPair: {
  //           name: 'HDMI2',
  //         icon: 'settings_input_hdmi',
  //         },
  //         subInputs: [],
  //         disabled: false
  //       },
  //       {
  //         id: 'ITB-1101-HDMI3',
  //         iconPair: {
  //           name: 'HDMI3',
  //         icon: 'settings_input_hdmi',
  //         },
  //         subInputs: [],
  //         disabled: false
  //       },
  //       {
  //         id: 'ITB-1101-HDMI4',
  //         iconPair: {
  //           name: 'HDMI4',
  //         icon: 'settings_input_hdmi',
  //         },
  //         subInputs: [],
  //         disabled: false
  //       },
  //       // {
  //       //   id: 'ITB-1101-HDMI5',
  //       //   iconPair: {
  //       //     name: 'HDMI5',
  //       //   icon: 'settings_input_hdmi',
  //       //   },
  //       //   subInputs: [],
  //       //   disabled: false
  //       // }
  //     );
  //   }
  // }

  // private _setupAudioGroups(conGroup: ControlGroup, deviceList: Device[], preset: Preset, config: UIConfig) {
  //   const displayAudioGroup = new AudioGroup();
  //   displayAudioGroup.audioDevices = [];
  //   displayAudioGroup.id = conGroup.id + '-Displays';
  //   displayAudioGroup.name = 'Display Volume Mixing';
  //   for (const a of preset.audioDevices) {
  //     const ad = new AudioDevice();
  //     const device = deviceList.find((d) => {
  //       return d.name === a;
  //     });
  //     const io = config.outputConfiguration.find((i) => {
  //       return i.name === a;
  //     });

  //     ad.id = device.id;
  //     ad.name = device.displayName;
  //     ad.icon = io.icon;
  //     ad.level = 30;
  //     ad.muted = false;

  //     displayAudioGroup.audioDevices.push(ad);
  //   }
  //   conGroup.audioGroups.push(displayAudioGroup);

  //   const indyAudioGroup = new AudioGroup();
  //   indyAudioGroup.audioDevices = [];
  //   indyAudioGroup.id = conGroup.id + '-Microphones';
  //   indyAudioGroup.name = 'Microphone Volume';
  //   for (const ia of preset.independentAudioDevices) {
  //     const ad = new AudioDevice();
  //     const device = deviceList.find((d) => {
  //       return d.name === ia;
  //     });
  //     const io = config.outputConfiguration.find((i) => {
  //       return i.name === ia;
  //     });

  //     ad.id = device.id;
  //     ad.name = device.displayName;
  //     ad.icon = io.icon;
  //     ad.level = 100;
  //     ad.muted = false;

  //     indyAudioGroup.audioDevices.push(ad);
  //   }

  //   conGroup.audioGroups.push(indyAudioGroup);
  // }

  // private _setupPresentGroups(cg: ControlGroup) {
  //   const pg1 = new PresentGroup();
  //   pg1.id = 'Room Options';
  //   pg1.name = 'Room Options';
  //   pg1.items = [
  //     {
  //       id: 'ITB-1101-VIA1',
  //       name: 'ITB-1101-VIA1 (Wireless Presentation)'
  //     },
  //     {
  //       id: 'ITB-1101-HDMI1',
  //       name: 'ITB-1101-HDMI1 (HDMI Jack)'
  //     }
  //   ];

  //   const pg2 = new PresentGroup();
  //   pg2.id = 'My Box Content';
  //   pg2.name = 'My Box Content';
  //   pg2.items = [
  //     {
  //       id: 'Ancient Greece Presentations',
  //       name: 'Ancient Greece Presentations'
  //     },
  //     {
  //       id: 'Lecture 2019-01-31.pptx',
  //       name: 'Lecture 2019-01-31.pptx'
  //     }
  //   ];

  //   cg.presentGroups.push(pg1, pg2);
  // }

  // setInput = (cg: ControlGroup, i: Input, selectedDisplays: string[]) => {
  //   for (const d of selectedDisplays) {
  //     for (const disp of cg.displays) {
  //       if (disp.id.includes(d)) {
  //         disp.input = i.id;
  //         disp.blanked = false;
  //       }
  //     }
  //   }

  //   this._setRoomState(cg);
  // }

  // setBlank = (cg: ControlGroup, blanked: boolean, display: string) => {
  //   const d = cg.displays.find(disp => {
  //     return disp.id === display;
  //   });
  //   if (d.blanked !== blanked) {
  //     d.blanked = blanked;

  //     this._setRoomState(cg);
  //   }
  // }

  // setVolume = (cg: ControlGroup, level: number, audioID: string) => {
  //   const ad = cg.getAudioDevice(audioID);
  //   ad.level = level;

  //   this._setRoomState(cg);
  // }

  // setMute = (cg: ControlGroup, muted: boolean, audioID: string) => {
  //   const ad = cg.getAudioDevice(audioID);
  //   ad.muted = muted;

  //   this._setRoomState(cg);
  // }

  // private _setRoomState(cg: ControlGroup) {
  //   const body = {
  //     displays: [],
  //     audioDevices: []
  //   };

  //   for (const d of cg.displays) {
  //     body.displays.push({
  //       name: this._getNameFromID(d.id),
  //       input: this._getNameFromID(d.input),
  //       blanked: d.blanked
  //     });
  //   }

  //   for (const g of cg.audioGroups) {
  //     for (const ad of g.audioDevices) {
  //       body.audioDevices.push({
  //         name: this._getNameFromID(ad.id),
  //         volume: ad.level,
  //         muted: ad.muted
  //       });
  //     }
  //   }

  //   const bID = this.room.id.split('-')[0];
  //   const rID = this.room.id.split('-')[1];

  //   console.log('the body is', body);

  //   try {
  //     const data = this.http.put(this.apiURL + '/buildings/' + bID + '/rooms/' + rID, body, { headers: this.headers }).toPromise();
  //   } catch (e) {
  //     throw new Error('failed to set room state: ' + e);
  //   }
  // }

  // private _getNameFromID(id: string): string {
  //   if (id === undefined) {
  //     return 'ATV1';
  //   }
  //   return id.split('-')[2];
  // }
}
