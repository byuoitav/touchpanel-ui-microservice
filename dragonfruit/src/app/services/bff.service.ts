import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JsonConvert } from 'json2typescript';
import { Device, UIConfig, IOConfiguration } from '../objects/database';

@Injectable({
  providedIn: 'root'
})
export class BFFService {
  private headers: HttpHeaders;
  private converter: JsonConvert;
  apiURL = 'http://ITB-1101-CP2.byu.edu:8000';
  dbURL = 'http://arrowhead.byu.edu:9999';

  constructor(
    private http: HttpClient
  ) {
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    this.converter = new JsonConvert();
    this.converter.ignorePrimitiveChecks = false;
  }

  // TODO: everything. Probably stuff with websockets, talking to the BFF, etc.
  // For now I am going to use this service to get the stuff that I need for the screens to work.

  public async getDevicesInRoom(roomID: string) {
    try {
      const data: any = await this.http
        .get(this.dbURL + '/rooms/' + roomID + '/devices',
        { headers: this.headers }).toPromise();

      const devices = this.converter.deserializeArray(data, Device);

      return devices;
    } catch (e) {
      throw new Error('error getting devices in room ' + roomID + ': ' + e);
    }
  }

  public async getUIConfig(roomID: string) {
    try {
      const data: any = await this.http
        .get(this.dbURL + '/uiconfigs/' + roomID,
        { headers: this.headers }).toPromise();

      const config = this.converter.deserializeObject(data, UIConfig);

      return config;
    } catch (e) {
      throw new Error('error getting the ui config for the room ' + roomID + ': ' + e);
    }
  }
}
