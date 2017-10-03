import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { UIConfiguration } from './objects';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';

const RETRY_TIMEOUT = 5 * 1000;
const MONITOR_TIMEOUT = 30 * 1000;

@Injectable()
export class APIService {
	public building: string;
	public room: string;
	public hostname: string;

	public uiconfig: UIConfiguration;

	private apihost: string;
	private apiurl: string;
	private localurl: string;
	private options: RequestOptions;
	
	constructor(private http: Http) {
		let headers = new Headers();
		headers.append('content-type', 'application/json');
		this.options = new RequestOptions({ headers: headers})

		let base = location.origin.split(':');
		this.localurl = base[0] + ":" + base[1];

		this.uiconfig = new UIConfiguration();

		this.setupHostname();
	}

	// hostname, building, room
	private setupHostname() {
		this.getHostname().subscribe(
			data => {
				this.hostname = String(data);

				let split = this.hostname.split('-');
				this.building = split[0];
				this.room = split[1];
				
				this.setupAPIUrl(false);
			}, err => {
				setTimeout(() => this.setupHostname(), RETRY_TIMEOUT);
			});
	}

	private setupAPIUrl(next: boolean) {
		if (next) {
			console.error("switching to next api")
			this.getNextAPIUrl().subscribe(
				data => {
				}, err => {
					setTimeout(() => this.setupAPIUrl(next), RETRY_TIMEOUT);
				}
			)
		}

		this.getAPIUrl().subscribe(
			data => {
				this.apihost = "http://" + location.hostname;
				if (!data["apihost"].includes("localhost") && data["enabled"]) {
					this.apihost = "http://" + data["apihost"];
				}

				this.apiurl = this.apihost + ":8000/buildings/" + this.building + "/rooms/" + this.room; 
				console.log("API url:", this.apiurl);

				if (data["enabled"] && !next) {
					console.log("Monitoring API");
					this.monitorAPI();
				}

				if (!next) {
					this.setupUIConfig();
				}
			}, err => {
				setTimeout(() => this.setupAPIUrl(next), RETRY_TIMEOUT);
			}
		)
	}

	private monitorAPI() {
		this.getAPIHealth().subscribe(data => {
			if (data["statuscode"] != 0) {
				this.setupAPIUrl(true);
			}

			setTimeout(() => this.monitorAPI(), MONITOR_TIMEOUT);
		}, err => {
			this.setupAPIUrl(true);
			setTimeout(() => this.monitorAPI(), MONITOR_TIMEOUT);
		});
	}

	private setupUIConfig() {
		this.getUIConfig().subscribe(
			data => {
				this.uiconfig = new UIConfiguration();
				Object.assign(this.uiconfig, data);
				console.log("UI Configuration:", this.uiconfig);
			}, err => {
				setTimeout(() => this.setupUIConfig(), RETRY_TIMEOUT);
			}
		);
	}

	put(data: any) {
		let val = this.http.put(this.apiurl, data, this.options).map((res => res.json()));
	}

	get(url: string, success: Function = func => {}, err: Function = func => { }, after: Function = func => {}): void {
		this.http.get(url)
			.map(response => response.json())
			.subscribe(
			data => {
				success();
			},
			error => {
				console.error("error:", error);
				err();
			},
			() => {
				after();
			}
		);
	}

	getHostname(): Observable<Object> {
		return this.http.get(this.localurl + ":8888/hostname")
			.map(response => response.json());
	}

	getAPIUrl(): Observable<Object> {
		return this.http.get(this.localurl + ":8888/api")
			.map(response => response.json());
	}

	getAPIHealth(): Observable<Object> {
		return this.http.get(this.apihost + ":8000/mstatus")
			.timeout(RETRY_TIMEOUT)
			.map(response => response.json());
	}

	getNextAPIUrl(): Observable<Object> {
		return this.http.get(this.localurl + ":8888/nextapi")
			.map(response => response.json());
	}

	getUIConfig(): Observable<Object> {
		return this.http.get(this.localurl + ":8888/json")
			.map(response => response.json());
	}
}
