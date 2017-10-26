import { Injectable, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { MatSliderChange } from '@angular/material';

import { APIService } from './api.service';
import { Input, Display, AudioDevice } from './status.objects';
import { WheelComponent } from './wheel.component';

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

	public changeInput(i: Input, displays: Display[],) {
		console.log("Changing input on", displays,"to", i.name);
        let prev = Display.getInput(displays);
        displays.forEach(d => d.input = i); 

		let body = { displays: [] }
		for (let d of displays) {
			body.displays.push({
				"name": d.name,
				"input": i.name,
			});
		}

		this.put(body).subscribe(
			data => {
				console.log("Success");
			}, err => {
                displays.forEach(d => d.input = prev);
			}
		);
	}


    public changeVolume(v: number, audioDevices: AudioDevice[]) {
        console.log("changing volume to", v);
        let prev = AudioDevice.getVolume(audioDevices);
        audioDevices.forEach(a => a.volume = v);

        let body = { audioDevices: [] };
        for (let a of audioDevices) {
            body.audioDevices.push({
                "name": a.name,
                "volume": v
            });
        }

		this.put(body).subscribe(
			data => {
				console.log("Success");
			}, err => {
                audioDevices.forEach(a => a.volume = prev);
			}
		);
    }
}
