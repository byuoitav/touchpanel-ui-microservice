import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import 'rxjs/add/operator/map';

@Injectable()
export class APIService {
	public building: string;
	public room: string;
	public url: string;
	
	private options: RequestOptions;
	private headers: Headers;

	constructor (private http: Http) {}

	
	setup(building: string, room: string) {
		this.building = building;
		this.room = room;
		this.url = "http://localhost:8000" + "/buildings/" + building + "/rooms/" + room;
		console.log("url =", this.url);

		this.headers = new Headers();
		this.headers.append('Content-Type', 'application/json');
		this.options = new RequestOptions({ headers: this.headers });
	}

	getRoomConfig(): Observable<Object> {
		return this.http.get(this.url + "/configuration")
				.map(response => response.json());
	}

	getRoomStatus(): Observable<Object> {
		return this.http.get(this.url)
				.map(response => response.json());
	}

	putData(data: any): Observable<Object> {
		let body = JSON.stringify(data);
		console.log("putting:", data, "to", this.url, "with options", this.options);

        var val = this.http.put(this.url, data, this.options).map((res: Response) => res.json())
        val.subscribe();

		return val;
	}

	publish(event: any) {
		let body = JSON.stringify(event);
		console.log("publishing:", event);

		this.http.post("http://localhost:8888/publish", body, this.options).map((res: Response) => res.json()).subscribe();
	}

	handleError(error: Response | any) {
		let msg: string;
		msg = error.message ? error.message : error.toString();
		console.log(msg);
		
		return Observable.throw(msg);	
	}
}
