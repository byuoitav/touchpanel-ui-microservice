import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { UIConfiguration, Room, RoomConfiguration, RoomStatus} from '../objects/objects';
import { Event } from './socket.service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { deserialize } from 'serializer.ts/Serializer';

const RETRY_TIMEOUT = 5 * 1000;
const MONITOR_TIMEOUT = 30 * 1000;

@Injectable()
export class APIService {
	public loaded: EventEmitter<boolean>;

	public static building: string;
	public static roomName: string;
	public static piHostname: string;
	public static hostname: string;
	public static apiurl: string;

	public static room: Room;

	private static apihost: string;
	private static localurl: string;
	private static options: RequestOptions;

	constructor(private http: Http) {
		this.loaded = new EventEmitter<boolean>();

		if (APIService.options == null) {
			let headers = new Headers();
			headers.append('content-type', 'application/json');
			APIService.options = new RequestOptions({ headers: headers})
	
			let base = location.origin.split(':');
			APIService.localurl = base[0] + ":" + base[1];
	
			APIService.room = new Room();	
			
			this.setupHostname();
		} else {
			this.loaded.emit(true);	
		}
	}

    private setupHostname() {
        this.getHostname().subscribe(
            data => {
                APIService.hostname = String(data); 
                this.setupPiHostname();
            }, err => {
                setTimeout(() => this.setupHostname(), RETRY_TIMEOUT); 
            }); 
    }

	// hostname, building, room
	private setupPiHostname() {
		this.getPiHostname().subscribe(
			data => {
				APIService.piHostname = String(data);

				let split = APIService.piHostname.split('-');
				APIService.building = split[0];
				APIService.roomName = split[1];
				
				this.setupAPIUrl(false);
			}, err => {
				setTimeout(() => this.setupPiHostname(), RETRY_TIMEOUT);
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
				APIService.apihost = "http://" + location.hostname;
				if (!data["hostname"].includes("localhost")) {
					APIService.apihost = "http://" + data["hostname"];
				}

				APIService.apiurl = APIService.apihost + ":8000/buildings/" + APIService.building + "/rooms/" + APIService.roomName; 
				console.info("API url:", APIService.apiurl);

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
				APIService.room.uiconfig = new UIConfiguration();
				Object.assign(APIService.room.uiconfig, data);
				console.info("UI Configuration:", APIService.room.uiconfig);

				this.setupRoomConfig();
			}, err => {
				setTimeout(() => this.setupUIConfig(), RETRY_TIMEOUT);
			}
		);
	}

	private setupRoomConfig() {
		this.getRoomConfig().subscribe(
			data => {
				APIService.room.config = new RoomConfiguration();
				Object.assign(APIService.room.config, data);

				console.info("Room Configuration:", APIService.room.config);

				this.setupRoomStatus();
			}, err => {
				setTimeout(() => this.setupRoomConfig(), RETRY_TIMEOUT);
			}
		);
	}

	private setupRoomStatus() {
		this.getRoomStatus().subscribe(
			data => {
				APIService.room.status = new RoomStatus();
				Object.assign(APIService.room.status, data);
				console.info("Room Status:", APIService.room.status);

				this.loaded.emit(true);
			}, err => {
				setTimeout(() => this.setupRoomStatus(), RETRY_TIMEOUT);
			}
		);
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

	private getHostname(): Observable<Object> {
		return this.http.get(APIService.localurl + ":8888/hostname")
			.map(response => response.json());
	}

	private getPiHostname(): Observable<Object> {
		return this.http.get(APIService.localurl + ":8888/pihostname")
			.map(response => response.json());
	}

	private getAPIUrl(): Observable<Object> {
		return this.http.get(APIService.localurl + ":8888/api")
			.map(response => response.json());
	}

	private getAPIHealth(): Observable<Object> {
		return this.http.get(APIService.apihost + ":8000/mstatus")
			.timeout(RETRY_TIMEOUT)
			.map(response => response.json());
	}

private getNextAPIUrl(): Observable<Object> { return this.http.get(APIService.localurl + ":8888/nextapi")
			.map(response => response.json());
	}

	private getUIConfig(): Observable<Object> {
		return this.http.get(APIService.localurl + ":8888/uiconfig")
			.map(response => response.json())
			.map(res => deserialize<UIConfiguration>(UIConfiguration, res));
	}

	private getRoomConfig(): Observable<Object> {
		return this.http.get(APIService.apiurl + "/configuration")
			.map(response => response.json())
			.map(res => deserialize<RoomConfiguration>(RoomConfiguration, res));
	}

	private getRoomStatus(): Observable<Object> {
		return this.http.get(APIService.apiurl)
			.map(response => response.json())
			.map(res => deserialize<RoomStatus>(RoomStatus, res));
	}

    public sendFeatureEvent(event: Event) {
        console.log("sending feature event", event);    

        this.http.post(APIService.localurl + ":8888/publishfeature", event, APIService.options)
                .map(res => res.json())
                .subscribe();
    }

    public requestHelp(): Observable<Object> {
        let body = { building: APIService.building, room: APIService.roomName};
        console.log("requesting help", body); 

        return this.http.post(APIService.localurl + ":8888/help", body,APIService.options)
            .map(res => res.json())
    }
}
