import {Injectable, EventEmitter} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {
  $WebSocket,
  WebSocketConfig
} from "angular2-websocket/angular2-websocket";
import {
  JsonConvert,
  OperationMode,
  ValueCheckingMode,
  JsonObject,
  JsonProperty,
  Any,
  JsonCustomConvert,
  JsonConverter
} from "json2typescript";

export const OPEN = "open";
export const CLOSE = "close";
export const MESSAGE = "message";
@Injectable()
export class SocketService {
  private url: string;

  private socket: $WebSocket;
  private listener: EventEmitter<any>;
  private http: HttpClient;
  private webSocketConfig: WebSocketConfig = {
    initialTimeout: 100,
    maxTimeout: 500,
    reconnectIfNotNormalClose: true
  };

  public screenoff: boolean;

  public constructor() {
    this.url = "ws://" + window.location.host + "/websocket";
    this.socket = new $WebSocket(this.url, null, this.webSocketConfig);
    this.listener = new EventEmitter();
    this.screenoff = false;

    const jsonConvert = new JsonConvert();
    jsonConvert.ignorePrimitiveChecks = false;

    this.socket.onMessage(
      msg => {
        if (msg.data.includes("keepalive")) {
          // TODO send a pong back
        } else if (msg.data.includes("refresh")) {
          console.log("refreshing!");
          location.assign("http://" + location.hostname + ":8888/");
        } else if (msg.data.includes("screenoff")) {
          console.log("adding screenoff element");
          this.screenoff = true;
        } else if (msg.data.includes("websocketTest")) {
          console.log("socket test");
        } else {
          const data = JSON.parse(msg.data);
          const event = jsonConvert.deserialize(data, Event);

          console.debug("received event", event);
          this.listener.emit({type: MESSAGE, data: event});
        }
      },
      {autoApply: false}
    );

    this.socket.onOpen(msg => {
      console.log("Websocket opened with", this.url, ":", msg);
      this.listener.emit({type: OPEN});
    });

    this.socket.onError(msg => {
      console.log("websocket closed.", msg);
      this.listener.emit({type: CLOSE});
    });

    this.socket.onClose(msg => {
      console.log("trying again", msg);
    });
  }

  public close() {
    this.socket.close(false);
  }

  public getEventListener() {
    return this.listener;
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
