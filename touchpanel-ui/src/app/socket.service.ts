import { Injectable, EventEmitter } from '@angular/core'
import { Http } from '@angular/http'

@Injectable()
export class SocketService {
  private socket: WebSocket;
  private listener: EventEmitter<any> = new EventEmitter();
  private http: Http;

  public constructor() {
    this.socket = new WebSocket("ws://localhost:8888/websocket");

    this.socket.onopen = event => {
      this.listener.emit({ "type": OPEN, "data": event });
	  console.log("opened websocket");
    }

    this.socket.onclose = event => {
      this.listener.emit({ "type": CLOSE, "data": event });
	  console.log("websocket on close event recieved");
	  this.socket = new WebSocket("ws://localhost:8888/websocket");
    }

    this.socket.onmessage = event => {
	  if (event.data.includes("keepalive")) {
	 	// send a keep alive back?
		console.log("keep alive message recieved.");
	  } else {
      	this.listener.emit({ "type": MESSAGE, "data": event });
	  }
    }
  }

  public close() {
    this.socket.close();
  }

  public getEventListener() {
    return this.listener;
  }
}

export const OPEN: string = "open";
export const CLOSE: string = "close";
export const MESSAGE: string = "message";
