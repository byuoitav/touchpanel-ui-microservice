import { Injectable, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { MatSliderChange } from '@angular/material';

import { APIService } from './api.service';
import { DataService } from './data.service';
import { Input, Display, AudioDevice } from '../objects/status.objects';
import { Preset } from '../objects/objects';
import { WheelComponent } from '../components/wheel.component';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { deserialize } from 'serializer.ts/Serializer';

const TIMEOUT = 12 * 1000;

@Injectable()
export class CommandService {

	private options: RequestOptions;

	constructor(private http: Http, private data: DataService) {
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
        i.click.emit();

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

        this.putWithCustomTimeout(body, 20*1000).subscribe(
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

    public share(from: Display, to: Display[], toAudio: AudioDevice[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
        if (from.input == null) {
            setTimeout(() => ret.emit(false), 150); 
            return ret;
        }


        let body = { displays: [], audioDevices: [] }; 
        for (let d of to) {
            body.displays.push({
                "name": d.name,
                "power": "on",
                "blanked": false,
                "input": from.input.name
            }); 
        }

        if (toAudio.some(a => a.roomWideAudio)) {
            // mute the source device
            body.audioDevices.push({
                "name": from.name,
                "muted": true,
                "volume": 0
            }); 

            for (let a of toAudio) {
                if (a.roomWideAudio) {
                    body.audioDevices.push({
                        "name": a.name,
                        "input": from.input.name,
                        "muted": false,
                        "volume": 30
                    });  
                } else {
                    body.audioDevices.push({
                        "name": a.name,
                        "muted": true,
                        "volume": 0
                    }); 
                }
            }
        } else {
            // mute everything else
            for (let a of toAudio) {
                body.audioDevices.push({
                    "name": a.name,
                    "muted": true,
                    "volume": 0
                }); 
            }
        }

        console.log("display to all body:", body);

		this.putWithCustomTimeout(body, 20*1000).subscribe(
			data => {
                ret.emit(true);
			}, err => {
                ret.emit(false);
			}
		);

        return ret;
    }

    public unShare(to: Display[], toAudio: AudioDevice[]): EventEmitter<boolean> {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
        let body = { displays: [], audioDevices: [] }; 

        for (let d of to) {
            let preset: Preset = this.data.presets.find(p => p.displays.includes(d));

            if (preset != null) {
                body.displays.push({
                    "name": d.name,
                    "power": "on",
                    "input": preset.inputs[0].name,
                    "blanked": false
                });
            }
        }

        for (let a of toAudio) {
//            let preset: Preset = this.data.presets.find(p => p.audioDevices.includes(a));
            
            body.audioDevices.push({
                "name": a.name,
                "power": "on",
                "volume": 30,
                "muted": false
            });
        }

        console.log("body", body);

		this.putWithCustomTimeout(body, 20*1000).subscribe(
			data => {
                ret.emit(true);
			}, err => {
                ret.emit(false);
			}
		);

        return ret;
    }

    public mirror(mirror: Preset, on: Display[]) {
        let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
        let body = { displays: [] };

        let power: string = Display.getPower(mirror.displays);
        let input: Input = Display.getInput(mirror.displays);
        let blanked: boolean = Display.getBlank(mirror.displays);

        for (let d of on) {
            body.displays.push({
                "name": d.name,
                "power": power,
                "input": input.name,
                "blanked": blanked,
            });
        }

        this.put(body).subscribe(
            data => {
                ret.emit(true);
            }, err => {
                ret.emit(false);
            }
        );

        return ret;
    }
}
