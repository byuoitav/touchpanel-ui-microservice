import { Injectable, EventEmitter } from "@angular/core";
import { Http } from "@angular/http";
import {
  $WebSocket,
  WebSocketConfig
} from "angular2-websocket/angular2-websocket";
import { deserialize } from "serializer.ts/Serializer";

export const OPEN = "open";
export const CLOSE = "close";
export const MESSAGE = "message";

@Injectable()
export class SocketService {
  private url: string;

  private socket: $WebSocket;
  private listener: EventEmitter<any>;
  private http: Http;
  private webSocketConfig: WebSocketConfig = {
    initialTimeout: 100,
    maxTimeout: 500,
    reconnectIfNotNormalClose: true
  };

  public screenoff: boolean;

  public constructor() {
    this.url = "ws://" + location.hostname + ":8888/websocket";
    this.socket = new $WebSocket(this.url, null, this.webSocketConfig);
    this.listener = new EventEmitter();
    this.screenoff = false;

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
          const event = deserialize<EventWrapper>(EventWrapper, data);
          console.log("received event", event);
          this.listener.emit({ type: MESSAGE, data: event });
        }
      },
      { autoApply: false }
    );

    this.socket.onOpen(msg => {
      console.log("Websocket opened with", this.url, ":", msg);
      this.listener.emit({ type: OPEN });
    });

    this.socket.onError(msg => {
      console.log("websocket closed.", msg);
      this.listener.emit({ type: CLOSE });
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

export class EventWrapper {
  hostname: string;
  timestamp: string;
  localEnvironment: boolean;
  event: Event;
  building: string;
  room: string;
}

export class Event {
  type: number;
  eventCause: number;
  requestor: string;
  device: string;
  eventInfoKey: string;
  eventInfoValue: string;

  constructor(
    type: number,
    eventCause: number,
    requestor: string,
    device: string,
    eventInfoKey: string,
    eventInfoValue: string
  ) {
    this.type = type;
    this.eventCause = eventCause;
    this.requestor = requestor;
    this.device = device;
    this.eventInfoKey = eventInfoKey;
    this.eventInfoValue = eventInfoValue;
  }
}
