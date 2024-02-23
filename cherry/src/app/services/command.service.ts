import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpRequest,  HttpHeaders, HttpParams} from "@angular/common/http";
import { catchError, tap, timeout } from 'rxjs/operators';
import { Observable, of, map } from "rxjs";

import { APIService } from "./api.service";
import { DataService } from "./data.service";
import { Event, BasicDeviceInfo, BasicRoomInfo } from "./socket.service";
import { Input, Display, AudioDevice } from "../objects/status.objects";
import { Preset, ConfigCommand } from "../objects/objects";
import { MatDialog } from "@angular/material/dialog";

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
  private options: {}

  constructor(
    private http: HttpClient,
    private data: DataService,
    public api: APIService,
    public dialog: MatDialog
  ) {
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    this.options = { headers: headers };
  }

  private put(data:any): Observable<Object> {
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
        ret.emit(true);
        console.log("power put data", data);
      },
      error: err => {
        Display.setPower(prev, displays);
        ret.emit(false);
        console.error("power put error", err);
      },
      complete: () => {
        console.log("power put completed");
      }
    });

    return ret;
  }

  public setInput(preset: Preset, i: Input, displays: Display[]): EventEmitter<boolean> {
    i.click.emit();

    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("Changing input on", displays, "to", i.name);
    const prev = Display.getInput(displays);
    Display.setInput(i, displays);

    // because we also want to unblank for this ui
    const prevBlank = Display.getBlank(displays);
    Display.setBlank(false, displays);

    const body = { displays: [] };
    for (const d of displays) {
      body.displays.push({
        name: d.name,
        input: i.name,
        blanked: false
      });
    }

    const changeInputReq = new CommandRequest(
      new HttpRequest("PUT", APIService.apiurl, body)
    );
    const requests: CommandRequest[] = [changeInputReq];

    const commandsToUse = preset.displays.some(
      d => d.input && d.input.name !== i.name
    )
      ? preset.commands.inputDifferent
      : preset.commands.inputSame;

    if (commandsToUse) {
      for (const cmd of commandsToUse) {
        requests.push(this.buildRequest(cmd));
      }
    }

    console.log("preset:", preset);
    console.log("executing requests:", requests);

    this.executeRequests(requests, 1, 14 * 1000).subscribe(success => {
      if (!success) {
        console.warn(
          "cannot set input, reverting displays back to previous selection"
        );
        Display.setInput(prev, displays);
        Display.setBlank(prevBlank, displays);
      }

      ret.emit(success);
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
        ret.emit(true);
        console.log("blank put data", data);
      },
      error: err => {
        Display.setBlank(prev, displays);
        ret.emit(false);
        console.error("blank put error", err);
      },
      complete: () => {
        console.log("blank put completed");
      }
    });

    return ret;
  }

  public setVolume(v: number, audioDevices: AudioDevice[]): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing volume to", v, "on", audioDevices);
    const prev = AudioDevice.getVolume(audioDevices);
    AudioDevice.setVolume(v, audioDevices);

    const body = { audioDevices: [] };
    for (const a of audioDevices) {
      body.audioDevices.push({
        name: a.name,
        volume: v
      });
    }

    console.log("volume body", body);

    this.put(body).subscribe({
      next: data => {
        ret.emit(true);
        console.log("volume put data", data);
      },
      error: err => {
        AudioDevice.setVolume(prev, audioDevices);
        ret.emit(false);
        console.error("volume put error", err);
      },
      complete: () => {
        console.log("volume put completed");
      }
    });

    return ret;
  }

  public setMute(m: boolean, audioDevices: AudioDevice[]): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing mute to", m, "on", audioDevices);
    const prev = AudioDevice.getMute(audioDevices);
    AudioDevice.setMute(m, audioDevices);

    const body = { audioDevices: [] };
    for (const a of audioDevices) {
      body.audioDevices.push({
        name: a.name,
        muted: m
      });
    }

    this.put(body).subscribe({
      next: data => {
        ret.emit(true);
        console.log("mute put data", data);
      },
      error: err => {
        AudioDevice.setMute(prev, audioDevices);
        ret.emit(false);
        console.error("mute put error", err);
      },
      complete: () => {
        console.log("mute put completed");
      }
    });

    return ret;
  }

  public setMuteAndVolume(m: boolean, v: number, audioDevices: AudioDevice[]): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing volume to", v, "and mute to", m, "on", audioDevices);
    const prevMute = AudioDevice.getMute(audioDevices);
    AudioDevice.setMute(m, audioDevices);

    const prevVol = AudioDevice.getVolume(audioDevices);
    AudioDevice.setVolume(v, audioDevices);

    const body = { audioDevices: [] };
    for (const a of audioDevices) {
      body.audioDevices.push({
        name: a.name,
        volume: v,
        muted: m
      });
    }

    this.put(body).subscribe({
      next: data => {
        ret.emit(true);
        console.log("mute and volume put data", data);
      },
      error: err => {
        AudioDevice.setMute(prevMute, audioDevices);
        AudioDevice.setVolume(prevVol, audioDevices);
        ret.emit(false);
        console.error("mute and volume put error", err);
      },
      complete: () => {
        console.log("mute and volume put completed");
      }
    });

    return ret;
  }

  public setMasterVolume(v: number, preset: Preset): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing master volume to", v, "for preset", preset);
    const prev = preset.masterVolume;
    preset.masterVolume = v;

    const body = { audioDevices: [] };
    for (const a of preset.audioDevices) {
      const vol = a.mixlevel * (v / 100);
      body.audioDevices.push({
        name: a.name,
        volume: Math.round(vol),
        muted: a.mixmute
      });
    }

    console.log("volume body", body);

    this.put(body).subscribe({
      next: data => {
        // post master volume update
        const event = new Event();

        event.User = APIService.piHostname;
        event.EventTags = ["ui-communication"];
        event.AffectedRoom = new BasicRoomInfo(
          APIService.building + "-" + APIService.roomName
        );
        event.TargetDevice = new BasicDeviceInfo(
          APIService.building + "-" + APIService.roomName + "-" + preset.name
        );
        event.Key = "master-volume";
        event.Value = String(v);
        event.Data = preset.name;

        this.api.sendEvent(event);
        ret.emit(true);
        console.log("volume put data", data);
      },
      error: err => {
        preset.masterVolume = prev;
        ret.emit(false);
        console.error("volume put error", err);
      },
      complete: () => {
        console.log("volume put completed");
      }
    });

    return ret;
  }

  public setMasterMute(m: boolean, preset: Preset): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing master mute to", m, "for preset", preset);

    const prev = preset.masterMute;
    preset.masterMute = m;

    const body = { audioDevices: [] };
    for (const a of preset.audioDevices) {
      body.audioDevices.push({
        name: a.name,
        muted: a.mixmute || m
      });
    }

    console.log("master mute body", body);

    this.put(body).subscribe({
      next: data => {
        const event = new Event();

        event.User = APIService.piHostname;
        event.EventTags = ["ui-communication"];
        event.AffectedRoom = new BasicRoomInfo(
          APIService.building + "-" + APIService.roomName
        );
        event.TargetDevice = new BasicDeviceInfo(
          APIService.building + "-" + APIService.roomName + "-" + preset.name
        );
        event.Key = "master-mute";
        event.Value = String(m);
        event.Data = preset.name;

        this.api.sendEvent(event);
        ret.emit(true);
        console.log("master mute put data", data);
      },
      error: err => {
        preset.masterMute = prev;
        ret.emit(false);
        console.error("master mute put error", err);
      },
      complete: () => {
        console.log("master mute put completed");
      }
    });

    
    return ret;
  }

  public setMixLevel(v: number, a: AudioDevice, preset: Preset): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing mix level to", v, "for audioDevice", a);
    const prev = a.mixlevel;
    a.mixlevel = v;

    const body = { audioDevices: [] };
    const vol = v * (preset.masterVolume / 100);
    body.audioDevices.push({
      name: a.name,
      volume: Math.round(vol)
    });

    console.log("volume body", body);

    this.put(body).subscribe({
      next: data => {
        const event = new Event();

        event.User = APIService.piHostname;
        event.EventTags = ["ui-communication"];
        event.AffectedRoom = new BasicRoomInfo(
          APIService.building + "-" + APIService.roomName
        );
        event.TargetDevice = new BasicDeviceInfo(
          APIService.building + "-" + APIService.roomName + "-" + preset.name
        );
        event.Key = "mix-level";
        event.Value = String(v);

        this.api.sendEvent(event);
        ret.emit(true);
        console.log("volume put data", data);
      },
      error: err => {
        a.mixlevel = prev;
        ret.emit(false);
        console.error("volume put error", err);
      },
      complete: () => {
        console.log("volume put completed");
      }
    });
  
    return ret;
  }

  public setMixMute(m: boolean, a: AudioDevice, preset: Preset): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("changing mix mute to", m, "for audioDevice", a);
    console.log("preset.masterMute is:", preset.masterMute);

    const prev = a.mixmute;
    a.mixmute = m;

    const body = { audioDevices: [] };
    body.audioDevices.push({
      name: a.name,
      muted: m
    });

    console.log("mix mute body:", body);

    this.put(body).subscribe({
      next: data => {
        const event = new Event();

        event.User = APIService.piHostname;
        event.EventTags = ["ui-communication"];
        event.AffectedRoom = new BasicRoomInfo(
          APIService.building + "-" + APIService.roomName + "-" + a.name
        );
        event.Key = "mix-mute";
        event.Value = String(m);

        this.api.sendEvent(event);

        ret.emit(true);
        console.log("mix mute put data", data);
      },
      error: err => {
        a.mixmute = prev;
        ret.emit(false);
        console.error("mix mute put error", err);
      },
      complete: () => {
        console.log("mix mute put completed");
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
        muted: false,
        volume: 30
      });
    }

    preset.masterMute = false;

    console.log("sending power on default body", body);

    const powerOnReq = new CommandRequest(
      new HttpRequest("PUT", APIService.apiurl, body)
    );
    const requests: CommandRequest[] = [powerOnReq];

    if (preset.commands.powerOn != null) {
      for (const cmd of preset.commands.powerOn) {
        requests.push(this.buildRequest(cmd));
      }
    }

    if (preset.commands.inputSame) {
      for (const cmd of preset.commands.inputSame) {
        requests.push(this.buildRequest(cmd));
      }
    }

    if (preset.cameras != null) {
      for (const camera of preset.cameras) {
        if (camera.presets[0].setPreset != null) {/*if preset 0 exists recall preset 0*/
          console.log("Recalling camera preset0", camera.presets[0].setPreset)
          const camPreset = new CommandRequest(
            new HttpRequest("GET", camera.presets[0].setPreset, null)
          );
          requests.push(camPreset);
        }
      }
    }

    this.executeRequests(requests, 1, 20 * 1000).subscribe(success => {
      ret.emit(success);
    });
    return ret;
  }

  private executeRequests(requests: CommandRequest[], maxTries: number, timeout: number): EventEmitter<boolean> {
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

  private executeRequest(req: CommandRequest, maxTries: number, timeOut: number): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    console.log("executing request", req);

    setTimeout(() => {
      this.http.request(req.req).pipe(
        timeout(timeOut),
        tap(res => console.log("request response", res)),
        catchError(this.handleError("executeRequest", []))
      ).subscribe({
        next: data => {
          console.log("successfully executed request", req);
          console.log("data", data);
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
          console.log("complete");
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

  public powerOff(preset: Preset): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    const body = { displays: [], audioDevices: [] };
    for (const d of preset.displays) {
      body.displays.push({
        name: d.name,
        power: "standby",
        input: preset.inputs[0].name
      });
    }

    console.log("sending power off body", body);

    for (const a of preset.audioDevices) {
      body.audioDevices.push({
        name: a.name,
        muted: false,
        volume: 30
      });
    }

    preset.masterMute = false;

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
        ret.emit(true);
        console.log("power off all put data", data);
      },
      error: err => {
        ret.emit(false);
        console.error("power off all put error", err);
      },
      complete: () => {
        console.log("power off all put completed");
      }
    });

    return ret;
  }

  /*
  public share(from: Display, to: Display[]): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    if (from.input == null) {
      setTimeout(() => ret.emit(false), 150);
      return ret;
    }

    console.log("sharing to", to, "from", from);

    const body = { displays: [], audioDevices: [] };
    for (const d of to) {
      body.displays.push({
        name: d.name,
        power: "on",
        blanked: false,
        input: from.input.name
      });
    }

    const audioConfigs = this.data.getAudioConfigurations(to);
    const hasRoomWide = this.data.hasRoomWide(audioConfigs);

    if (hasRoomWide) {
      // mute the source device (yourself)
      body.audioDevices.push({
        name: from.name,
        muted: true,
        volume: 0
      });

      for (const config of audioConfigs) {
        for (const audio of config.audioDevices) {
          body.audioDevices.push({
            name: audio.name,
            muted: !config.roomWide,
            volume: config.roomWide ? 30 : 0
          });
        }
      }
    } else {
      // mute everything except for yourself
      for (const config of audioConfigs) {
        for (const audio of config.audioDevices) {
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
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    const body = { displays: [], audioDevices: [] };

    for (const d of from) {
      const preset: Preset = this.data.presets.find(p =>
        p.displays.includes(d)
      );

      if (preset != null) {
        body.displays.push({
          name: d.name,
          power: "on",
          input: preset.inputs[0].name,
          blanked: false
        });
      }
    }

    for (const ac of fromAudio) {
      for (const a of ac.audioDevices) {
        body.audioDevices.push({
          name: a.name,
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
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();
    const body = { displays: [], audioDevices: [] };

    const power: string = Display.getPower(mirror.displays);
    const input: Input = Display.getInput(mirror.displays);
    const blanked: boolean = Display.getBlank(mirror.displays);

    for (const d of on.displays) {
      body.displays.push({
        name: d.name,
        power: power,
        input: input.name,
        blanked: blanked
      });
    }

    for (const a of on.audioDevices) {
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
     */

  public viaControl(via: Input, endpoint: string): EventEmitter<boolean> {
    const ret: EventEmitter<boolean> = new EventEmitter<boolean>();

    // get the address of the via
    const config = this.data.getInputConfiguration(via);

    // build the request
    const req = new HttpRequest("GET", APIService.apihost + ":8014/via/" + config.address + "/" + endpoint);

    // execute request
    console.log("executing via control request:", req);

    this.http.request(req).subscribe({
      next: data => {
        ret.emit(true);
        console.log("via control request data", data);
      },
      error: err => {
        ret.emit(false);
        console.error("via control request error", err);
      },
      complete: () => {
        console.log("via control request completed");
      }
    });

    return ret;
  }

  public buttonPress(value: string, data?: any) {
    const event = new Event();

    event.EventTags = ["ui-event", "cherry-ui"];

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

