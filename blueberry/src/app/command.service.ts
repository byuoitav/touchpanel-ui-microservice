import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { APIService } from './api.service';
import { Display, InputDevice } from './objects';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { deserialize } from 'serializer.ts/Serializer';

const TIMEOUT = 1.5 * 1000;

@Injectable()
export class CommandService {

	private options: RequestOptions;

	constructor(private http: Http) {
		let headers = new Headers();	
		headers.append('content-type', 'application/json');
		this.options = new RequestOptions({ headers: headers})
	}

	private put(data: any): Observable<Object> {
		return this.http.put(APIService.apiurl, data, this.options)
						.timeout(TIMEOUT)
						.map(res => res.json());
	}

	public changeInput(i: InputDevice, d: Display) {
		console.log("Changing input on", d.names,"to", i.name);
		let old = d.input;
		d.input = i;

		let body = {displays: []}
		for (let n of d.names) {
			body.displays.push({
				"name": n,
				"input": i.name,
			});
		}

		this.put(body).subscribe(
			data => {
				console.log("Success");
			}, err => {
				d.input = old;		
			}
		);
	}
}
