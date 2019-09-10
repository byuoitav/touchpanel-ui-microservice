import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JsonConvert } from 'json2typescript';
import { Device, UIConfig, IOConfiguration, DBRoom, Preset } from '../objects/database';
import { Room, ControlGroup, Display, Input, AudioDevice, AudioGroup } from '../objects/control';

@Injectable({
  providedIn: 'root'
})
export class BFFService {
  private headers: HttpHeaders;
  private converter: JsonConvert;
  apiURL = 'http://ITB-1101-CP2.byu.edu:8000';
  dbURL = 'http://arrowhead.byu.edu:9999';

  public room: Room;

  private inputReach: Map<string, string[]>;

  public done: EventEmitter<boolean>;

  constructor(
    private http: HttpClient
  ) {
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    this.converter = new JsonConvert();
    this.converter.ignorePrimitiveChecks = false;
    this.done = new EventEmitter();
  }

  // TODO: everything. Probably stuff with websockets, talking to the BFF, etc.
  // For now I am going to use this service to get the stuff that I need for the screens to work.

  setupRoom = (roomID: string) => {
    this._getDBRoom(roomID).then((answer) => {
      this.room = new Room(answer.id, answer.name);

      console.log(answer);
      console.log(this.room);

      this._getInputReachability(roomID).then((ir) => {
        this.inputReach = ir;

        this._getUIConfig(roomID).then((config) => {
          this.room.controlGroups = [];
          for (const p of config.presets) {
            const cg = new ControlGroup();
            cg.id = p.name;
            cg.name = p.name;
            cg.displays = [];
            cg.inputs = [];
            cg.audioGroups = [];

            this._setupDisplays(cg, answer.devices, p, config);
            this._setupInputs(cg, answer.devices, p, config);
            this._setupAudioGroups(cg, answer.devices, p, config);
            console.log(cg);
            this.room.controlGroups.push(cg);
          }

          this.done.emit(true);
        });
      });
    });
  }

  private async _getDBRoom (roomID: string) {
    try {
      const data = await this.http.get(
        this.dbURL + '/rooms/' + roomID,
        { headers: this.headers }).toPromise();

      const room = this.converter.deserializeObject(data, DBRoom);

      return room;
    } catch (e) {
      throw new Error('error getting the room from the database: ' + e);
    }
  }

  private async _getUIConfig (roomID: string) {
    try {
      const data = await this.http.get(
        this.dbURL + '/uiconfigs/' + roomID,
        { headers: this.headers }).toPromise();

      const config = this.converter.deserializeObject(data, UIConfig);

      return config;
    } catch (e) {
      throw new Error('error getting the ui config from the database: ' + e);
    }
  }

  private async _getInputReachability(roomID: string) {
    const roomIDParts = roomID.split('-');
    const bID = roomIDParts[0];
    const rID = roomIDParts[1];

    try {
      const data = await this.http.get(
        this.apiURL + '/buildings/' + bID + '/rooms/' + rID + '/configuration',
        { headers: this.headers }).toPromise();

      const room = this.converter.deserializeObject(data, DBRoom);

      console.log(room.inputReachability);
      return room.inputReachability;
    } catch (e) {
      throw new Error('error getting the room configuration from the av api: ' + e);
    }
  }

  private _setupDisplays(conGroup: ControlGroup, deviceList: Device[], preset: Preset, config: UIConfig) {
    for (const d of preset.displays) {
      const display = new Display();
      const device = deviceList.find((a) => {
        return a.name === d;
      });
      const io = config.outputConfiguration.find((a) => {
        return a.name === d;
      });

      display.id = device.id;
      display.name = device.displayName;
      display.icon = io.icon;
      display.allowedInputs = [];

      this.inputReach.forEach((v, k) => {
        if (v.includes(d) && !display.allowedInputs.includes(k)) {
          display.allowedInputs.push(k);
        }
      });

      conGroup.displays.push(display);
    }
  }

  private _setupInputs(conGroup: ControlGroup, deviceList: Device[], preset: Preset, config: UIConfig) {
    for (const i of preset.inputs) {
      const input = new Input();
      const device = deviceList.find((a) => {
        return a.name === i;
      });
      const io = config.inputConfiguration.find((a) => {
        return a.name === i;
      });

      input.id = device.id;
      input.name = device.displayName;
      input.icon = io.icon;
      input.subInputs = [];

      if (io.subInputs !== undefined && io.subInputs.length > 0) {
        for (const subI of io.subInputs) {
          const si = new Input();
          si.id = subI.name;
          si.name = subI.displayName;
          si.icon = subI.icon;
          input.subInputs.push(si);
        }
      }

      conGroup.inputs.push(input);
    }
  }

  private _setupAudioGroups(conGroup: ControlGroup, deviceList: Device[], preset: Preset, config: UIConfig) {
    const displayAudioGroup = new AudioGroup();
    displayAudioGroup.audioDevices = [];
    displayAudioGroup.id = conGroup.id + '-Displays';
    displayAudioGroup.name = 'Display Volume Mixing';
    for (const a of preset.audioDevices) {
      const ad = new AudioDevice();
      const device = deviceList.find((d) => {
        return d.name === a;
      });
      const io = config.outputConfiguration.find((i) => {
        return i.name === a;
      });

      ad.id = device.id;
      ad.name = device.displayName;
      ad.icon = io.icon;
      ad.level = 30;
      ad.muted = false;

      displayAudioGroup.audioDevices.push(ad);
    }
    conGroup.audioGroups.push(displayAudioGroup);

    const indyAudioGroup = new AudioGroup();
    indyAudioGroup.audioDevices = [];
    indyAudioGroup.id = conGroup.id + '-Microphones';
    indyAudioGroup.name = 'Microphone Volume';
    for (const ia of preset.independentAudioDevices) {
      const ad = new AudioDevice();
      const device = deviceList.find((d) => {
        return d.name === ia;
      });
      const io = config.outputConfiguration.find((i) => {
        return i.name === ia;
      });

      ad.id = device.id;
      ad.name = device.displayName;
      ad.icon = io.icon;
      ad.level = 100;
      ad.muted = false;

      indyAudioGroup.audioDevices.push(ad);
    }

    conGroup.audioGroups.push(indyAudioGroup);
  }
}
