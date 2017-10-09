import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { APIService } from './api.service';
import { OutputDevice, InputDevice } from './objects';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { deserialize } from 'serializer.ts/Serializer';

const TIMEOUT = 1.5 * 1000;

@Injectable()
export class CommandService {

	private device: OutputDevice;
	private options: RequestOptions;

	constructor(private http: Http) {
		let headers = new Headers();	
		headers.append('content-type', 'application/json');
		this.options = new RequestOptions({ headers: headers})
	}

	public setup(device: OutputDevice) {
		this.device = device;	
	}

	private put(data: any): Observable<Object> {
		return this.http.put(APIService.apiurl, data, this.options)
						.timeout(TIMEOUT)
						.map(res => res.json());
	}

	public changeInput(i: InputDevice) {
		console.log("Changing input to", i);
		let old = this.device.input;
		this.device.input = i;

		let body = {displays: []}
		for (let n of this.device.names) {
			body.displays.push({
				"name": n,
				"input": i.name,
			});
		}

		this.put(body).subscribe(
			data => {
				console.log("Success");
			}, err => {
				this.device.input = old;		
			}
		);
	}
}
