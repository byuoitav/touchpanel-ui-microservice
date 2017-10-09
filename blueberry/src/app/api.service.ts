import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { UIConfiguration, Room, RoomConfiguration, RoomStatus, Device } from './objects';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { deserialize } from 'serializer.ts/Serializer';

const RETRY_TIMEOUT = 5 * 1000;
const MONITOR_TIMEOUT = 30 * 1000;

@Injectable()
export class APIService {
	public loaded: EventEmitter<boolean>;

	public building: string;
	public roomName: string;
	public hostname: string;
	public apiurl: string;

	public uiconfig: UIConfiguration;
	public room: Room;

	private apihost: string;
	private localurl: string;
	private options: RequestOptions;

	constructor(private http: Http) {
		let headers = new Headers();
		headers.append('content-type', 'application/json');
		this.options = new RequestOptions({ headers: headers})

		let base = location.origin.split(':');
		this.localurl = base[0] + ":" + base[1];

		this.uiconfig = new UIConfiguration();
		this.room = new Room();	
		this.loaded = new EventEmitter<boolean>();

//		this.setupHostname();
	}

	// hostname, building, room
	public setupHostname() {
		this.getHostname().subscribe(
			data => {
				this.hostname = String(data);

				let split = this.hostname.split('-');
				this.building = split[0];
				this.roomName = split[1];
				
				this.setupAPIUrl(false);
			}, err => {
				setTimeout(() => this.setupHostname(), RETRY_TIMEOUT);
			});
	}

	private setupAPIUrl(next: boolean) {
		if (next) {
			console.warn("switching to next api")
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

				this.apiurl = this.apihost + ":8000/buildings/" + this.building + "/rooms/" + this.roomName; 
				console.info("API url:", this.apiurl);

				if (data["enabled"] && !next) {
					console.info("Monitoring API");
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
				console.info("UI Configuration:", this.uiconfig);

				this.setupRoomConfig();
			}, err => {
				setTimeout(() => this.setupUIConfig(), RETRY_TIMEOUT);
			}
		);
	}

	private setupRoomConfig() {
		this.getRoomConfig().subscribe(
			data => {
				this.room.config = new RoomConfiguration();
				Object.assign(this.room.config, data);

				console.info("Room Configuration:", this.room.config);

				this.setupRoomStatus();
			}, err => {
				setTimeout(() => this.setupRoomConfig(), RETRY_TIMEOUT);
			}
		);
	}

	private setupRoomStatus() {
		this.getRoomStatus().subscribe(
			data => {
				this.room.status = new RoomStatus();
				Object.assign(this.room.status, data);
				console.info("Room Status:", this.room.status);

				this.loaded.emit(true);
			}, err => {
				setTimeout(() => this.setupRoomStatus(), RETRY_TIMEOUT);
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
			.map(response => response.json())
			.map(res => deserialize<UIConfiguration>(UIConfiguration, res));
	}

	getRoomConfig(): Observable<Object> {
		return this.http.get(this.apiurl + "/configuration")
			.map(response => response.json())
			.map(res => deserialize<RoomConfiguration>(RoomConfiguration, res));
	}

	getRoomStatus(): Observable<Object> {
		return this.http.get(this.apiurl)
			.map(response => response.json())
			.map(res => deserialize<RoomStatus>(RoomStatus, res));
	}
}
