import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable, Subject } from 'rxjs/Rx';
import { UIConfiguration } from './objects'

import 'rxjs/add/operator/map';

@Injectable()
export class APIService {
  public building: string;
  public room: string;
  public baseurl: string;
  public url: string;
  public loaded: Subject<boolean>;
  public uiconfig: UIConfiguration; 
  public hostname: string;
  private bool: boolean;

  private options: RequestOptions;
  private headers: Headers;

  constructor(private http: Http) { this.loaded = new Subject<boolean>(); this.uiconfig = new UIConfiguration();}

  setup() {
	console.log("starting api setup")
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    this.options = new RequestOptions({ headers: this.headers });
	let base = location.origin.split(':');
	this.baseurl = base[0] + ":" + base[1];
	console.log("baseurl:", this.baseurl);

	this.setupHostname();
  }

  setupHostname() {
	  this.getHostname().subscribe(data => {
	  	  this.hostname = String(data);
	      console.log("hostname =", this.hostname);
	      let split = JSON.stringify(data).split('-');
	      let b = split[0].substring(1);
	
	      this.building = b;
	      this.room = split[1];
	
	      this.url = this.baseurl + ":8000" + "/buildings/" + this.building + "/rooms/" + this.room;
	      console.log("url =", this.url);

		  this.setupUiConfig();
	  }, err => {
		  console.log("error getting hostname");
		  setTimeout(() => this.setupHostname(), 2500);
	  });
  }

  setupUiConfig() {
 	this.getJSON().subscribe(data => {
		Object.assign(this.uiconfig, data);
		console.log("uiconfig", this.uiconfig);	
		this.loaded.next(true);
	}, err => {
		console.log("error getting json");
		setTimeout(() => this.setupUiConfig(), 2500);
	}) 
  }

  getJSON(): Observable<Object> {
 	return this.http.get(this.baseurl + ":8888/json")
  		.map(response => response.json());	
  }

  getHostname(): Observable<Object> {
    return this.http.get(this.baseurl + ":8888/hostname")
      .map(response => response.json());
  }

  getDeviceInfo(): Observable<Object> {
    return this.http.get(this.baseurl + ":8888/deviceinfo")
      .map(response => response.json());
  }

  getDockerStatus(): Observable<Object> {
    return this.http.get(this.baseurl + ":8888/dockerstatus")
      .map(response => response.text());
  }

  reboot(): Observable<Object> {
    return this.http.get(this.baseurl + ":8888/reboot")
      .map(response => response.json());
  }

  getRoomConfig(): Observable<Object> {
    return this.http.get(this.url + "/configuration")
      .map(response => response.json());
  }

  getRoomStatus(): Observable<Object> {
    return this.http.get(this.url)
      .map(response => response.json());
  }

  get(url: string): Observable<Object> {
    return this.http.get(url)
      .map(response => response.json());
  }

  putData(data: any) {
    console.log("PUT:", data, "to", this.url); //, "with options", this.options);

    var val = this.http.put(this.url, data, this.options).map((res: Response) => res.json())

    return val;
  }

  postHelp(data, type) {
 	console.log("POST", data, "to", this.baseurl + ":8888/help") 
	if (type == "help") {
		return this.http.post(this.baseurl + ":8888/help", data, this.options).map((res: Response) => res.json());
	} else if (type == "confirm") {
		return this.http.post(this.baseurl + ":8888/confirmhelp", data, this.options).map((res: Response) => res.json());
	} else if (type == "cancel") {
		return this.http.post(this.baseurl + ":8888/cancelhelp", data, this.options).map((res: Response) => res.json());
	} else {
		return;	
	}
  }

  publish(event: any) {
    console.log("publishing:", event, "to", this.baseurl + ":8888/publish");

    this.http.post(this.baseurl + ":8888/publish", event, this.options).map((res: Response) => res.json()).subscribe();
  }

  publishFeature(event: any) {
    console.log("publishing feature:", event, "to", this.baseurl + ":8888/publishfeature");

    this.http.post(this.baseurl + ":8888/publishfeature", event, this.options).map((res: Response) => res.json()).subscribe();
  
  }

  handleError(error: Response | any) {
    let msg: string;
    msg = error.message ? error.message : error.toString();
    console.log(msg);

    return Observable.throw(msg);
  }
}
