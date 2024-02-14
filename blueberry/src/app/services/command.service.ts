import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams, HttpRequest } from "@angular/common/http";
import { catchError, tap} from 'rxjs/operators';
import { Observable, of, map, timeout} from "rxjs";

import { APIService } from "./api.service";
import { DataService } from "./data.service";
import { Event, BasicDeviceInfo, BasicRoomInfo } from "./socket.service";
import { Input, Display, AudioDevice } from "../objects/status.objects";
import { Preset, ConfigCommand } from "../objects/objects";

const TIMEOUT = 12 * 1000;

class CommandRequest {
  req: HttpRequest<any>;
  delay: number;

  constructor(req: HttpRequest<any>, delay?: number) {
    this.req = req;

    if (delay) {
      this.delay = delay;
    } else {
      this.delay = 0;
    }
  }
}

@Injectable()
export class CommandService {
  private options : {};
  
  constructor(
    private http: HttpClient,
    private data: DataService,
    private api: APIService
  ) {
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    this.options = { headers: headers };
  }

  private executeRequests(
    requests: CommandRequest[],
    maxTries: number,
    timeout: number
  ): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    if (requests.length < 1) {
      setTimeout(() => ret.emit(false), 250);
      return ret;
    }

    console.info("executing requests: ", requests);
    const numRequests = requests.length;
    const mapToStatus: Map<CommandRequest, boolean> = new Map();

    for (const req of requests) {
      this.executeRequest(req, maxTries, timeout).subscribe(success => {
        mapToStatus.set(req, success);

        if (mapToStatus.size === numRequests) {
          console.info(
            "finished all requests, requests => success:",
            mapToStatus
          );

          let allsuccessful = true;
          mapToStatus.forEach((v, k) => {
            if (!v) {
              allsuccessful = false;
            }
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
    req: CommandRequest,
    maxTries: number,
    timeOut: number,
  ): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("executing request", req);

    setTimeout(() => {
      this.http.request(req.req).pipe(
        timeout(timeOut),
        catchError(this.handleError("executeRequest", []))
      ).subscribe({
        next: data => {
          console.log("successfully executed request", req);
          ret.emit(true);
          return;
        },
        error: err => {
          maxTries--;

          if (maxTries === 0) {
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

          setTimeout(() => this.executeRequest(req, maxTries, timeOut), 3000);
        },
        complete: () => {
          console.log("request completed");
        }
      });
    }, req.delay);

    return ret;
  }

  private buildRequest(cmd: ConfigCommand): CommandRequest {
    // if we needed logic to create a request, it would be right here!!
    return new CommandRequest(
      new HttpRequest(cmd.method, APIService.apihost + ":" + cmd.port + "/" + cmd.endpoint, cmd.body),
      cmd.delay
    );
  }

  private put(data: any): Observable<Object> {
    return this.http.put(APIService.apiurl, data, this.options).pipe(
      timeout(TIMEOUT),
      map(res => res),
      catchError(this.handleError("put", []))
    );
  }
  
  private putWithCustomTimeout(data: any, timeOut: number): Observable<Object> {
    return this.http.put(APIService.apiurl, data, this.options).pipe(
      timeout(timeOut),
      map(res => res),
      catchError(this.handleError("putWithCustomTimeout", []))
    );
  }

  public setPower(p: string, displays: Display[]): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("Setting power to", p, "on", displays);
    const prev = Display.getPower(displays);
    Display.setPower(p, displays);

    const body = { displays: [] };
    for (const d of displays) {
      body.displays.push({
        name: d.name,
        power: p
      });
    }

    this.put(body).subscribe({
      next: data => {
        console.log("power put data", data);
        ret.emit(true);
      },
      error: err => {
        console.error("power put error", err);
        Display.setPower(prev, displays);
        ret.emit(false);
      },
      complete: () => {
        console.log("power put completed");
      }
    });

    return ret;
  }

  public setInput(i: Input, displays: Display[]): EventEmitter<boolean> {
    // i.click.emit();

    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("Changing input on", displays, "to", i.name);
    const prev = Display.getInput(displays);
    Display.setInput(i, displays);

    const body = { displays: [] };
    for (const d of displays) {
      body.displays.push({
        name: d.name,
        input: i.name
      });
    }

    this.put(body).subscribe({
      next: data => {
        console.log("input put data", data);
        ret.emit(true);
      },
      error: err => {
        console.error("input put error", err);
        Display.setInput(prev, displays);
        ret.emit(false);
      },
      complete: () => {
        console.log("input put completed");
      }
    });

    return ret;
  }

  public setBlank(b: boolean, displays: Display[]): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("Setting blanked to", b, "on", displays);
    const prev = Display.getBlank(displays);
    Display.setBlank(b, displays);

    const body = { displays: [] };
    for (const d of displays) {
      body.displays.push({
        name: d.name,
        blanked: b
      });
    }

    this.put(body).subscribe({
      next: data => {
        console.log("blank put data", data);
        ret.emit(true);
      },
      error: err => {
        console.error("blank put error", err);
        Display.setBlank(prev, displays);
        ret.emit(false);
      },
      complete: () => {
        console.log("blank put completed");
      }
    });

    return ret;
  }

  public setVolume(v: number, devices: AudioDevice[]): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing volume to", v, "on", devices);

    const prev = AudioDevice.getVolume(devices);
    AudioDevice.setVolume(v, devices);

    const body = { audioDevices: [] };
    for (const a of devices) {
      body.audioDevices.push({
        name: a.name,
        volume: v
      });
    }

    console.log("volume body", body);

    this.put(body).subscribe({
      next: data => {
        console.log("volume put data", data);
        ret.emit(true);
      },
      error: err => {
        console.error("volume put error", err);
        AudioDevice.setVolume(prev, devices);
        ret.emit(false);
      },
      complete: () => {
        console.log("volume put completed");
      }
    });

    return ret;
  }

  public setMute(m: boolean, devices: AudioDevice[]): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing mute to", m, "on", devices);
    const prev = AudioDevice.getMute(devices);
    AudioDevice.setMute(m, devices);

    const body = { audioDevices: [] };
    for (const a of devices) {
      body.audioDevices.push({
        name: a.name,
        muted: m
      });
    }

    console.log("mute body", body);

    this.put(body).subscribe({
      next: data => {
        console.log("mute put data", data);
        ret.emit(true);
      },
      error: err => {
        console.error("mute put error", err);
        AudioDevice.setMute(prev, devices);
        ret.emit(false);
      },
      complete: () => {
        console.log("mute put completed");
      }
    });

    return ret;
  }

  public powerOnDefault(preset: Preset): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    const body = { displays: [], audioDevices: [] };

    for (const d of preset.displays) {
      body.displays.push({
        name: d.name,
        power: "on",
        input: preset.inputs[0].name,
        blanked: false
      });
    }

    for (const a of preset.audioDevices) {
      body.audioDevices.push({
        name: a.name,
        power: "on",
        muted: false,
        volume: 30
      });
    }

    const powerOnReq = new CommandRequest(
      new HttpRequest("PUT", APIService.apiurl, body)

    );
    const requests: CommandRequest[] = [powerOnReq];

    if (preset.commands.powerOn != null) {
      for (const cmd of preset.commands.powerOn) {
        requests.push(this.buildRequest(cmd));
      }
    }

    this.executeRequests(requests, 1, 20 * 1000).subscribe(success => {
      ret.emit(success);
    });

    return ret;
  }

  public powerOff(preset: Preset): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    const body = { displays: [], audioDevices: [] };
    for (const d of preset.displays) {
      body.displays.push({
        name: d.name,
        power: "standby"
      });
    }

    for (const a of preset.audioDevices) {
      body.audioDevices.push({
        name: a.name,
        power: "standby"
      });
    }

    console.log("sending power off body", body);

    for (const a of preset.audioDevices) {
      body.audioDevices.push({
        name: a.name,
        power: "on",
        muted: false,
        volume: 30
      });
    }

    const powerOffReq = new CommandRequest(
      new HttpRequest("PUT", APIService.apiurl, body)
    );
    const requests: CommandRequest[] = [powerOffReq];

    if (preset.commands.powerOff != null) {
      for (const cmd of preset.commands.powerOff) {
        requests.push(this.buildRequest(cmd));
      }
    }

    this.executeRequests(requests, 1, 20 * 1000).subscribe(success => {
      ret.emit(success);
    });

    return ret;
  }

  public powerOffAll(): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    const body = { power: "standby" };

    this.put(body).subscribe({
      next: data => {
        console.log("powerOffAll put data", data);
        ret.emit(true);
      },
      error: err => {
        console.error("powerOffAll put error", err);
        ret.emit(false);
      },
      complete: () => {
        console.log("powerOffAll put completed");
      }
    });

    return ret;
  }

  public share(from: Preset, to: Preset[]): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    if (!from.displays[0] || !from.displays[0].input) {
      setTimeout(() => ret.emit(false), 150);
      return ret;
    }

    const input = from.displays[0].input;

    // displays i'm sharing to
    const displays: Display[] = from.displays.slice();
    to.forEach(p => displays.push(...p.displays));

    const body = { displays: [], audioDevices: [] };
    
    for (const preset of to) {
      for (const disp of preset.displays) {
        body.displays.push({
          name: disp.name,
          power: "on",
          blanked: false,
          input: input.name
        });
      }
    }

    const audioConfigs = this.data.getAudioConfigurations(displays);
    const hasRoomWide = this.data.hasRoomWide(audioConfigs);

    if (hasRoomWide) {
      // mute all the non-roomwide audio devices, unmute all roomwide
      for (const config of audioConfigs) {
        for (const audio of config.audioDevices) {
          if (config.roomWide) {
            body.audioDevices.push({
              name: audio.name,
              muted: false,
              volume: 30
            });
          } else {
            body.audioDevices.push({
              name: audio.name,
              muted: true
            });
          }
        }
      }
    } else {
      // mute everything except for yourself
      for (const config of audioConfigs) {
        for (const audio of config.audioDevices) {
          if (!from.audioDevices.some(a => a.name === audio.name)) {
            body.audioDevices.push({
              name: audio.name,
              muted: true
            });
          }
        }
      }
    }

    console.log("share body:", body);

    this.putWithCustomTimeout(body, 20 * 1000).subscribe({
      next: data => {
        console.log("share put data", data);
        ret.emit(true);
      },
      error: err => {
        console.error("share put error", err);
        ret.emit(false);
      },
      complete: () => {
        console.log("share put completed");
      }
    });

    return ret;
  }

  public unshare(from: Preset, to: Preset[]): EventEmitter<boolean> {
    const ret = new EventEmitter<boolean>();
    const body = { displays: [], audioDevices: [] };

    for (const preset of to) {
      for (const disp of preset.displays) {
        body.displays.push({
          name: disp.name,
          power: "on",
          input: preset.inputs[0].name,
          blanked: false
        });
      }

      for (const device of preset.audioDevices) {
        body.audioDevices.push({
          name: device.name,
          power: "on",
          volume: 30,
          muted: false
        });
      }
    }

    /*
    for (const disp of from.displays) {
      body.displays.push({
        name: disp.name,
        power: "on",
        input: from.inputs[0].name,
        blanked: false
      });
    }

    for (const device of from.audioDevices) {
      body.audioDevices.push({
        name: device.name,
        power: "on",
        volume: 30,
        muted: false
      });
    }
    */

    console.log("unshare body", body);
   
    this.putWithCustomTimeout(body, 20 * 1000).subscribe({
      next: data => {
        console.log("unshare put data", data);
        ret.emit(true);
      },
      error: err => {
        console.error("unshare put error", err);
        ret.emit(false);
      },
      complete: () => {
        console.log("unshare put completed");
      }
    });
    
    return ret;
  }

  public mirror(minion: Preset, master: Preset): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    const body = { displays: [] };

    const power = Display.getPower(master.displays);
    const input = Display.getInput(master.displays);
    const blanked = Display.getBlank(master.displays);

    for (const d of minion.displays) {
      body.displays.push({
        name: d.name,
        power: power,
        input: input.name,
        blanked: blanked
      });
    }

    console.log("mirror body", body);
    
    this.put(body).subscribe({
      next: data => {
        console.log("mirror put data", data);
        ret.emit(true);
      },
      error: err => {
        console.error("mirror put error", err);
        ret.emit(false);
      },
      complete: () => {
        console.log("mirror put completed");
      }
    });

    return ret;
  }

  public buttonPress(value: string, data?: any) {
    const event = new Event();

    event.EventTags = ["ui-event", "blueberry-ui"];

    event.AffectedRoom = new BasicRoomInfo(
      APIService.building + "-" + APIService.roomName
    );
    event.TargetDevice = new BasicDeviceInfo(APIService.piHostname);
    event.GeneratingSystem = APIService.piHostname;
    event.Timestamp = new Date();
    event.User = "";
    event.Data = data;

    event.Key = "user-interaction";
    event.Value = value;

    this.api.sendEvent(event);
  }

  private handleError<T>(operation: string, result?: T) {
    return (error: any): Observable<T> => {
      console.error("error doing:", operation, "err:", error)
      return of(result as T);
    };
  }
}
