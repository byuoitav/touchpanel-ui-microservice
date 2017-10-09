import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { APIService } from './api.service';
import { OutputDevice, InputDevice } from './objects';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { deserialize } from 'serializer.ts/Serializer';

@Injectable()
export class CommandService {

	private options: RequestOptions;
	private http: Http;

	constructor(private api: APIService) {
		let headers = new Headers();	
		headers.append('content-type', 'application/json');
		this.options = new RequestOptions({ headers: headers})
	}

	put(data: any): Observable<Object> {

		let val = this.http.put(this.api.apiurl, data, this.options).map(res => res.json());

		return val;
	}

	changeInput(i: InputDevice, d: OutputDevice): boolean {
		console.log("changing input to", i);

		let body = {displays: []}
		for (let n of d.names) {
			body.displays.push({
				"name": n,
				"input": i.name,
			});
		}

		this.put(body).subscribe(
			data => {
				console.log('response', data);	
			}
		);

		return true;
	}
}
