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


	getDevices(building: string, room: string): Observable<Object> {
		return this.http.get(this.url)
				.map(response => response.json())
	}

	postData(data: any) {
		let body = JSON.stringify(data);
		console.log("posting:", data);	

		return this.http.post(this.url, body, this.options).map((res: Response) => res.json());
	}
}
