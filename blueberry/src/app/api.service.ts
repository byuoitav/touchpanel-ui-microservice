import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';

@Injectable()
export class APIService {
	public building: string;
	public room: string;

	private apiurl: string;
	private localurl: string;
	private options: RequestOptions;
	
	constructor(private http: Http) {
		let headers = new Headers();
		headers.append('content-type', 'application/json');
		this.options = new RequestOptions({ headers: headers})

		let base = location.origin.split(':');
		this.localurl = base[0] + ":" + base[1];
		console.log("localurl:", this.localurl);
	}


	getHostname(): Observable<Object> {
		return this.http.get(this.localurl + ":8888/deviceinfo")
			.map(response => response.json());
	}
}
