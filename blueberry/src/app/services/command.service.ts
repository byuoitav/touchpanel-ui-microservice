import { Injectable, EventEmitter, ViewChild, ElementRef } from "@angular/core";
import {
  Http,
  Response,
  Headers,
  RequestOptions,
  Request
} from "@angular/http";
import { Observable } from "rxjs/Rx";
import { MatSliderChange } from "@angular/material";

import { APIService } from "./api.service";
import { DataService } from "./data.service";
import { Input, Display, AudioDevice } from "../objects/status.objects";
import { Preset, AudioConfig, ConfigCommand } from "../objects/objects";
import { WheelComponent } from "../components/wheel.component";

import "rxjs/add/operator/map";
import "rxjs/add/operator/timeout";
import { deserialize } from "serializer.ts/Serializer";

const TIMEOUT = 12 * 1000;

@Injectable()
export class CommandService {
  private options: RequestOptions;

  constructor(private http: Http, private data: DataService) {
    let headers = new Headers();
    headers.append("content-type", "application/json");
    this.options = new RequestOptions({ headers: headers });
  }

  private put(data: any): Observable<Object> {
    return this.http
      .put(APIService.apiurl, data, this.options)
      .timeout(TIMEOUT)
      .map(res => res.json());
  }

  private putWithCustomTimeout(data: any, timeout: number): Observable<Object> {
    return this.http
      .put(APIService.apiurl, data, this.options)
      .timeout(timeout)
      .map(res => res.json());
  }

  public setPower(p: string, displays: Display[]): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("Setting power to", p, "on", displays);
    let prev = Display.getPower(displays);
    Display.setPower(p, displays);

    let body = { displays: [] };
    for (let d of displays) {
      body.displays.push({
        name: d.name,
        power: p
      });
    }

    this.put(body).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        Display.setPower(p, displays);
        ret.emit(false);
      }
    );

    return ret;
  }

  public setInput(i: Input, displays: Display[]): EventEmitter<boolean> {
    //    i.click.emit();

    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("Changing input on", displays, "to", i.name);
    let prev = Display.getInput(displays);
    Display.setInput(i, displays);

    let body = { displays: [] };
    for (let d of displays) {
      body.displays.push({
        name: d.name,
        input: i.name
      });
    }

    this.put(body).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        Display.setInput(prev, displays);
        ret.emit(false);
      }
    );

    return ret;
  }

  public setBlank(b: boolean, displays: Display[]): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("Setting blanked to", b, "on", displays);
    let prev = Display.getBlank(displays);
    Display.setBlank(b, displays);

    let body = { displays: [] };
    for (let d of displays) {
      body.displays.push({
        name: d.name,
        blanked: b
      });
    }

    this.put(body).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        Display.setBlank(prev, displays);
        ret.emit(false);
      }
    );

    return ret;
  }

  public setVolume(
    v: number,
    audioDevices: AudioDevice[]
  ): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing volume to", v, "on", audioDevices);
    let prev = AudioDevice.getVolume(audioDevices);
    AudioDevice.setVolume(v, audioDevices);

    let body = { audioDevices: [] };
    for (let a of audioDevices) {
      body.audioDevices.push({
        name: a.name,
        volume: v
      });
    }

    console.log("volume body", body);

    this.put(body).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        AudioDevice.setVolume(prev, audioDevices);
        ret.emit(false);
      }
    );

    return ret;
  }

  public setMute(
    m: boolean,
    audioDevices: AudioDevice[]
  ): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing mute to", m, "on", audioDevices);
    let prev = AudioDevice.getMute(audioDevices);
    AudioDevice.setMute(m, audioDevices);

    let body = { audioDevices: [] };
    for (let a of audioDevices) {
      body.audioDevices.push({
        name: a.name,
        muted: m
      });
    }

    this.put(body).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        AudioDevice.setMute(prev, audioDevices);
        ret.emit(false);
      }
    );

    return ret;
  }

  public setMuteAndVolume(
    m: boolean,
    v: number,
    audioDevices: AudioDevice[]
  ): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing volume to", v, "and mute to", m, "on", audioDevices);
    let prevMute = AudioDevice.getMute(audioDevices);
    AudioDevice.setMute(m, audioDevices);

    let prevVol = AudioDevice.getVolume(audioDevices);
    AudioDevice.setVolume(v, audioDevices);

    let body = { audioDevices: [] };
    for (let a of audioDevices) {
      body.audioDevices.push({
        name: a.name,
        volume: v,
        muted: m
      });
    }

    this.put(body).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        AudioDevice.setMute(prevMute, audioDevices);
        AudioDevice.setVolume(prevVol, audioDevices);
        ret.emit(false);
      }
    );

    return ret;
  }

  public powerOnDefault(preset: Preset): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    let body = { displays: [], audioDevices: [] };

    for (let d of preset.displays) {
      body.displays.push({
        name: d.name,
        power: "on",
        input: preset.inputs[0].name,
        blanked: false
      });
    }

    for (let a of preset.audioDevices) {
      body.audioDevices.push({
        name: a.name,
        power: "on",
        muted: false,
        volume: 30
      });
    }

    let powerOnReq = new Request({
      method: "PUT",
      url: APIService.apiurl,
      body: body
    });
    let requests: Request[] = [powerOnReq];

    if (preset.commands.powerOn != null) {
      for (let cmd of preset.commands.powerOn) {
        requests.push(this.buildRequest(cmd));
      }
    }

    this.executeRequests(requests, 1, 20 * 1000).subscribe(success => {
      ret.emit(success);
    });

    return ret;
  }

  private executeRequests(
    requests: Request[],
    maxTries: number,
    timeout: number
  ): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    if (requests.length < 1) {
      setTimeout(() => ret.emit(false), 250);
      return ret;
    }

    console.info("executing requests: ", requests);
    let numRequests = requests.length;
    let mapToStatus: Map<Request, boolean> = new Map();

    for (let req of requests) {
      this.executeRequest(req, maxTries, timeout).subscribe(success => {
        mapToStatus.set(req, success);

        if (mapToStatus.size == numRequests) {
          console.info(
            "finished all requests, requests => success:",
            mapToStatus
          );

          let allsuccessful = true;
          mapToStatus.forEach((v, k) => {
            if (!v) allsuccessful = false;
          });

          ret.emit(allsuccessful);
          return;
        }
      });
    }

    console.log("waiting for", requests.length, "responses...");
    return ret;
  }

  private executeRequest(
    req: Request,
    maxTries: number,
    timeout: number
  ): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("executing request", req);

    this.http
      .request(req)
      .timeout(timeout)
      .subscribe(
        data => {
          console.log("successfully executed request", req);
          ret.emit(true);
          return;
        },
        err => {
          maxTries--;

          if (maxTries == 0) {
            ret.emit(false);
            return;
          }

          // retry request
          console.error(
            "request (" + req + ") failed. error:",
            err,
            ". There are",
            maxTries,
            " remaining, retrying in 3 seconds..."
          );
          setTimeout(() => this.executeRequest(req, maxTries, timeout), 3000);
        }
      );

    return ret;
  }

  private buildRequest(cmd: ConfigCommand): Request {
    return new Request({
      method: cmd.method,
      url: APIService.apihost + ":" + cmd.port + "/" + cmd.endpoint,
      body: cmd.body
    });
  }

  public powerOff(preset: Preset): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    let body = { displays: [], audioDevices: [] };
    for (let d of preset.displays) {
      body.displays.push({
        name: d.name,
        power: "standby"
      });
    }

    for (let a of preset.audioDevices) {
      body.audioDevices.push({
        name: a.name,
        power: "standby"
      });
    }

    console.log("sending power off body", body);

    let powerOffReq = new Request({
      method: "PUT",
      url: APIService.apiurl,
      body: body
    });
    let requests: Request[] = [powerOffReq];

    if (preset.commands.powerOff != null) {
      for (let cmd of preset.commands.powerOff) {
        requests.push(this.buildRequest(cmd));
      }
    }

    this.executeRequests(requests, 1, 20 * 1000).subscribe(success => {
      ret.emit(success);
    });

    return ret;
  }

  public powerOffAll(): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    let body = { power: "standby" };

    this.put(body).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        ret.emit(false);
      }
    );

    return ret;
  }

  public share(from: Display, to: Display[]): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    if (from.input == null) {
      setTimeout(() => ret.emit(false), 150);
      return ret;
    }

    console.log("sharing to", to, "from", from);

    let body = { displays: [], audioDevices: [] };
    for (let d of to) {
      body.displays.push({
        name: d.name,
        power: "on",
        blanked: false,
        input: from.input.name
      });
    }

    let audioConfigs = this.data.getAudioConfigurations(to);
    let hasRoomWide = this.data.hasRoomWide(audioConfigs);

    if (hasRoomWide) {
      // mute the source device (yourself)
      body.audioDevices.push({
        name: from.name,
        muted: true,
        volume: 0
      });

      for (let config of audioConfigs) {
        for (let audio of config.audioDevices) {
          body.audioDevices.push({
            name: audio.name,
            muted: !config.roomWide,
            volume: config.roomWide ? 30 : 0
          });
        }
      }
    } else {
      // mute everything except for yourself
      for (let config of audioConfigs) {
        for (let audio of config.audioDevices) {
          body.audioDevices.push({
            name: audio.name,
            muted: true,
            volume: 0
          });
        }
      }
    }

    console.log("share body:", body);

    this.putWithCustomTimeout(body, 20 * 1000).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        ret.emit(false);
      }
    );

    return ret;
  }

  public unShare(
    from: Display[],
    fromAudio: AudioConfig[]
  ): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    let body = { displays: [], audioDevices: [] };

    for (let d of from) {
      let preset: Preset = this.data.presets.find(p => p.displays.includes(d));

      if (preset != null) {
        body.displays.push({
          name: d.name,
          power: "on",
          input: preset.inputs[0].name,
          blanked: false
        });
      }
    }

    for (let ac of fromAudio) {
      for (let a of ac.audioDevices) {
        body.audioDevices.push({
          name: a.name,
          power: "on",
          volume: 30,
          muted: false
        });
      }
    }

    console.log("unshare body", body);

    this.putWithCustomTimeout(body, 20 * 1000).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        ret.emit(false);
      }
    );

    return ret;
  }

  public mirror(mirror: Preset, on: Preset) {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    let body = { displays: [], audioDevices: [] };

    let power: string = Display.getPower(mirror.displays);
    let input: Input = Display.getInput(mirror.displays);
    let blanked: boolean = Display.getBlank(mirror.displays);

    for (let d of on.displays) {
      body.displays.push({
        name: d.name,
        power: power,
        input: input.name,
        blanked: blanked
      });
    }

    for (let a of on.audioDevices) {
      body.audioDevices.push({
        name: a.name,
        muted: true
      });
    }

    this.put(body).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        ret.emit(false);
      }
    );

    return ret;
  }

  public viaControl(via: Input, endpoint: string): EventEmitter<boolean> {
    let ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    // get the address of the via
    let config = this.data.getInputConfiguration(via);

    // build the request
    let req = new Request({
      method: "GET",
      url: APIService.apihost + ":8014/via/" + config.address + "/" + endpoint
    });

    // execute request
    console.log("executing via control request:", req);
    this.http.request(req).subscribe(
      data => {
        ret.emit(true);
      },
      err => {
        ret.emit(false);
      }
    );

    return ret;
  }
}
