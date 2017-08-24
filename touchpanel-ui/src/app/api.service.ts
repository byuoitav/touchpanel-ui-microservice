import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { UIConfiguration } from './objects'

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';

const maxErrorsBeforeSwitch = 1;

@Injectable()
export class APIService {
  public building: string;
  public room: string;
  public baseurl: string;
  public url: string;
  public urlhost: string;
  public loaded: EventEmitter<any>;
  public uiconfig: UIConfiguration; 
  public hostname: string;
  public errorcount: number = 0;
  private bool: boolean;

  private options: RequestOptions;
  private headers: Headers;

  constructor(private http: Http) { this.loaded = new EventEmitter<any>(); this.uiconfig = new UIConfiguration();}

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

		  this.setupAPIUrl();
	  }, err => {
		  console.log("error getting hostname");
		  setTimeout(() => this.setupHostname(), 2500);
	  });
  }

  setupAPIUrl() {
 	this.getAPIUrl().subscribe(data => {
		if (data["apihost"].includes("localhost")) {
			let split = this.baseurl.split('://');
			this.urlhost = split[1];
		} else {
			this.urlhost = data["apihost"]
		}

		this.url = "http://" + this.urlhost + ":8000" + "/buildings/" + this.building + "/rooms/" + this.room;
	    console.log("api url =", this.url);

		this.setupUiConfig();
		if (data["enabled"] == true) {
			console.log("monitoring api status");
			this.monitorAPI();
		} else {
			console.log("not monitoring api");	
		}
	}), err => {
		console.log("error getting api url");
		setTimeout(() => this.setupAPIUrl(), 2500);
	} 
  }

  setupUiConfig() {
 	this.getJSON().subscribe(data => {
		this.uiconfig = new UIConfiguration();

		Object.assign(this.uiconfig, data);
		console.log("uiconfig", this.uiconfig);	
		this.loaded.emit(true);
	}, err => {
		console.log("error getting json");
		setTimeout(() => this.setupUiConfig(), 2500);
	});
  }

  monitorAPI() {
	this.getAPIHealth().subscribe(data => {
		if (data["statuscode"] != 0) {
			this.apiError();	
		}
		setTimeout(() => this.monitorAPI(), 10000);
	}, err => {
		this.apiError();
		setTimeout(() => this.monitorAPI(), 10000);
	});	
  }

  apiError() {
 	this.errorcount++;
    if (this.errorcount == maxErrorsBeforeSwitch || this.errorcount > maxErrorsBeforeSwitch) {
		this.errorcount = 0;
		console.log("Switching to next api");
		this.switchToNextAPI();	
	}	
  }

  switchToNextAPI() {
 	this.getNextAPIUrl().subscribe(data => {
		if (data["apihost"].includes("localhost")) {
			let split = this.baseurl.split('://');
			this.urlhost = split[1];
		} else {
			this.urlhost = data["apihost"]
		}

		this.url = "http://" + this.urlhost + ":8000" + "/buildings/" + this.building + "/rooms/" + this.room;
	    console.log("new url =", this.url);
	}, err => {
		console.log("error getting next api");
		setTimeout(() => this.switchToNextAPI(), 2500);
	});
  }

  getAPIHealth(): Observable<Object> {
 	return this.http.get("http://"+ this.urlhost + ":8000/mstatus")
		.timeout(3000)
   		.map(response => response.json());	
  }

  getNextAPIUrl(): Observable<Object> {
 	return this.http.get(this.baseurl + ":8888/nextapi")
   		.map(response => response.json());	
  }

  getAPIUrl(): Observable<Object> {
 	return this.http.get(this.baseurl + ":8888/api")
   		.map(response => response.json());	
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
      .timeout(3000)
      .map(response => response.json());
  }

  getRoomStatus(): Observable<Object> {
    return this.http.get(this.url)
      .timeout(3000)
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
