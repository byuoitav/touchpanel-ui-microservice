import { Injectable, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { MatSliderChange } from '@angular/material';

import { APIService } from './api.service';
import { Input, Display, AudioDevice } from '../objects/status.objects';
import { Preset } from '../objects/objects';
import { WheelComponent } from '../components/wheel.component';

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

	private putWithCustomTimeout(data: any, timeout: number): Observable<Object> {
		return this.http.put(APIService.apiurl, data, this.options)
						.timeout(timeout)
						.map(res => res.json());
	}

    public setPower(p: string, displays: Display[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
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
                ret.emit(true);
			}, err => {
                Display.setPower(p, displays);
                ret.emit(false);
			}
		);

        return ret;
    }

	public setInput(i: Input, displays: Display[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
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
                ret.emit(true);
			}, err => {
                Display.setInput(prev, displays);
                ret.emit(false);
			}
		);

        return ret;
	}

    public setBlank(b: boolean, displays: Display[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
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
                ret.emit(true);
			}, err => {
                Display.setBlank(prev, displays);
                ret.emit(false);
			}
		);

        return ret;
    }

    public setVolume(v: number, audioDevices: AudioDevice[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
        console.log("changing volume to", v, "on", audioDevices);
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
                ret.emit(true);
			}, err => {
                AudioDevice.setVolume(prev, audioDevices);
                ret.emit(false);
			}
		);

        return ret;
    }

    public setMute(m: boolean, audioDevices: AudioDevice[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
        console.log("changing mute to", m, "on", audioDevices);
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
                ret.emit(true);
			}, err => {
                AudioDevice.setMute(prev, audioDevices);
                ret.emit(false);
			}
		);

        return ret;
    }

    public powerOnDefault(preset: Preset): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
        
        let body = { displays: [], audioDevices: [] }

        for (let d of preset.displays) {
            body.displays.push({
                "name": d.name,
                "power": "on",
                "input": preset.inputs[0].name,
                "blanked": false
            }); 
        }

        for (let a of preset.audioDevices) {
            body.audioDevices.push({
                "name": a.name,
                "power": "on",
                "muted": false,
                "volume": 30
            }); 
        }

        this.putWithCustomTimeout(body, 10*1000).subscribe(
			data => {
                ret.emit(true);
			}, err => {
                ret.emit(false);
			}
        );

        return ret;
    }

    public powerOffAll(): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();

        let body = { power: "standby" };

        this.put(body).subscribe(
            data => {
                ret.emit(true);
            }, err => {
                ret.emit(false);
            }
        );
         
        return ret;
    }

    public displayToAll(i: Input, displays: Display[], audioDevices: AudioDevice[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
        console.log("displaying", i, "to all displays:", displays);
        let body = { displays: [], audioDevices: [] }; 
        for (let d of displays) {
            body.displays.push({
                "name": d.name,
                "power": "on",
                "blanked": false,
                "input": i.name
            }); 
        }

        for (let a of audioDevices) {
            if (a.roomWideAudio) {
                body.audioDevices.push({
                    "name": a.name,
                    "input": i.name,
                    "muted": false,
                    "volume": 30
                });
            } else {
                body.audioDevices.push({
                    "name": a.name,
                    "muted": true
                });
            }
        }

		this.putWithCustomTimeout(body, 2.5*1000).subscribe(
			data => {
                ret.emit(true);
			}, err => {
                ret.emit(false);
			}
		);

        return ret;
    }

    public unDisplayToAll(oldDisplays: Display[], oldAudioDevices: AudioDevice[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
        console.log("un displaying-to-all to displays", oldDisplays);
        let body = { displays: [], audioDevices: [] }; 

        for (let d of oldDisplays) {
            if (d.name == null || d.power == null || d.blanked == null || d.input == null) {
                continue; 
            }

            body.displays.push({
                "name": d.name,
                "power": d.power,
                "blanked": d.blanked,
                "input": d.input.name
            }); 
        }

        for (let a of oldAudioDevices) {
            if (a.name == null || a.power == null || a.muted == null || a.volume == null) {
                continue; 
            }

            body.audioDevices.push({
                "name": a.name,
                "power": a.power,
                "muted": a.muted,
                "volume": a.volume,
            });
        }

		this.putWithCustomTimeout(body, 2.5*1000).subscribe(
			data => {
                ret.emit(true);
			}, err => {
                ret.emit(false);
			}
		);
        return ret;
    }
}
