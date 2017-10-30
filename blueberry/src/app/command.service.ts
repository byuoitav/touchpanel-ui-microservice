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

    public setPower(p: string, displays: Display[]) {
		console.log("Setting power to", p,"on", displays);
        let prev = Display.getPower(displays);
        Display.setPower(p, displays);

		let body = { displays: [] }
		for (let d of displays) {
			body.displays.push({
				"name": d.name,
                "power": p 
			});
		}

		this.put(body).subscribe(
			data => {
				console.log("Success");
			}, err => {
                Display.setPower(p, displays);
			}
		);
    }

	public setInput(i: Input, displays: Display[],) {
		console.log("Changing input on", displays,"to", i.name);
        let prev = Display.getInput(displays);
        Display.setInput(i, displays);

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
                Display.setInput(prev, displays);
			}
		);
	}

    public setBlank(b: boolean, displays: Display[]) {
		console.log("Setting blanked to", b,"on", displays);
        let prev = Display.getBlank(displays);
        Display.setBlank(b, displays);

		let body = { displays: [] }
		for (let d of displays) {
			body.displays.push({
				"name": d.name,
                "blanked": b
			});
		}

		this.put(body).subscribe(
			data => {
				console.log("Success");
			}, err => {
                Display.setBlank(prev, displays);
			}
		);
    }

    public setVolume(v: number, audioDevices: AudioDevice[]) {
        console.log("changing volume to", v);
        let prev = AudioDevice.getVolume(audioDevices);
        AudioDevice.setVolume(v, audioDevices);

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
                AudioDevice.setVolume(prev, audioDevices);
			}
		);
    }

    public setMute(m: boolean, audioDevices: AudioDevice[]) {
        console.log("changing mute to", m);
        let prev = AudioDevice.getMute(audioDevices);
        AudioDevice.setMute(m, audioDevices);

        let body = { audioDevices: [] };
        for (let a of audioDevices) {
            body.audioDevices.push({
                "name": a.name,
                "muted": m
            });
        }

		this.put(body).subscribe(
			data => {
				console.log("Success");
			}, err => {
                AudioDevice.setMute(prev, audioDevices);
			}
		);
    }
}
