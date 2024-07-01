import {Injectable, EventEmitter} from "@angular/core";
import {map} from 'rxjs/operators'
import { Observable, tap } from "rxjs";
import {webSocket} from 'rxjs/webSocket';

import {
  Any,
  JsonConvert,
  JsonConverter,
  JsonCustomConvert,
  JsonObject,
  JsonProperty
} from "json2typescript";

export const OPEN = "open";
export const CLOSE = "close";
export const MESSAGE = "message";

@Injectable({
  providedIn: "root"
})
export class SocketService {
  public screenoff: boolean;
  private listener: EventEmitter<any>;

  constructor() {
    this.screenoff = false;
    this.listener = new EventEmitter();
  }

  public getEventListener(): Observable<any> {
    const jsonConvert = new JsonConvert();
    jsonConvert.ignorePrimitiveChecks = false;

    return new Observable<any>(observer => {
      const subject = webSocket("ws://" + window.location.host + "/websocket");

      subject.subscribe({
        next: (msg: any) => {
          console.log(msg.message);
          if (msg.message != undefined) {
            if (msg.message.includes("keepalive")) {
              //send a ping back
              subject.next({type: "ping"});
            } else if (msg.message.includes("refresh")) {
              console.log("refreshing");
              location.assign("http://" + location.hostname + ":8888/");
            } else if (msg.message.includes("screenoff")) {
              console.log("adding screenoff element");
              this.screenoff = true;
            } else if (msg.message.includes("websocketTest")) {
              console.log("Received Websocket Test Message");
              subject.next({type: "websocketTest"});
            } else {
              const data = JSON.parse(JSON.parse(msg));
              const event = jsonConvert.deserialize(data, Event);
              console.log("Received event: ", event);
              this.listener.emit({type: MESSAGE, data: event});
            }
          } else {
            const data = JSON.parse(JSON.parse(msg));
            const event = jsonConvert.deserializeObject(data, Event);
            console.log("Received event: ", event);
            this.listener.emit({type: MESSAGE, data: event});
          }
          observer.next(msg);
        },
        error: (err: any) => {
          console.debug("Observer Error:", err);
          observer.error(err);
        },
        complete: () => {
          console.debug("Observer Complete");
          observer.complete();
        }
      });

    });
  }
}

@JsonObject("BasicRoomInfo")
export class BasicRoomInfo {
  @JsonProperty("buildingID", String, true)
  BuildingID = "";

  @JsonProperty("roomID", String, true)
  RoomID = "";

  constructor(roomID: string) {
    if (roomID == null || roomID === undefined) {
      return;
    }
    const split = roomID.split("-");

    if (split.length === 2) {
      this.BuildingID = split[0];
      this.RoomID = split[0] + "-" + split[1];
    }
  }
}

@JsonObject("BasicDeviceInfo")
export class BasicDeviceInfo {
  @JsonProperty("buildingID", String, true)
  BuildingID = "";

  @JsonProperty("roomID", String, true)
  RoomID = "";

  @JsonProperty("deviceID", String, true)
  DeviceID = "";

  constructor(deviceID: string) {
    if (deviceID == null || deviceID === undefined) {
      return;
    }
    const split = deviceID.split("-");

    if (split.length === 3) {
      this.BuildingID = split[0];
      this.RoomID = split[0] + "-" + split[1];
      this.DeviceID = split[0] + "-" + split[1] + "-" + split[2];
    }
  }
}

@JsonConverter
class DateConverter implements JsonCustomConvert<Date> {
  serialize(date: Date): any {
    function pad(n) {
      return n < 10 ? "0" + n : n;
    }

    return (
      date.getUTCFullYear() +
      "-" +
      pad(date.getUTCMonth() + 1) +
      "-" +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      ":" +
      pad(date.getUTCMinutes()) +
      ":" +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  }

  deserialize(date: any): Date {
    return new Date(date);
  }
}

@JsonObject("Event")
export class Event {
  @JsonProperty("generating-system", String, true)
  GeneratingSystem = "";

  @JsonProperty("timestamp", DateConverter, true)
  Timestamp: Date = undefined;

  @JsonProperty("event-tags", [String], true)
  EventTags: string[] = [];

  @JsonProperty("target-device", BasicDeviceInfo, true)
  TargetDevice = new BasicDeviceInfo(undefined);

  @JsonProperty("affected-room", BasicRoomInfo)
  AffectedRoom = new BasicRoomInfo(undefined);

  @JsonProperty("key", String, true)
  Key = "";

  @JsonProperty("value", String, true)
  Value = "";

  @JsonProperty("user", String, true)
  User = "";

  @JsonProperty("data", Any, true)
  Data: any = undefined;

  public hasTag(tag: string): boolean {
    return this.EventTags.includes(tag);
  }
}
