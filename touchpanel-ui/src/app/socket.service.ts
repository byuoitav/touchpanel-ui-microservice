import { Injectable, EventEmitter } from '@angular/core'
import { Http } from '@angular/http'
import { $WebSocket, WebSocketConfig } from 'angular2-websocket/angular2-websocket'

@Injectable()
export class SocketService {
  private socket: $WebSocket;
  private listener: EventEmitter<any> = new EventEmitter();
  private http: Http;
  private webSocketConfig: WebSocketConfig = {
 	initialTimeout: 100,
    maxTimeout: 500,
	reconnectIfNotNormalClose: true	
  }

  public constructor() {
	this.socket = new $WebSocket("ws://" + location.hostname +":8888/websocket", null, this.webSocketConfig);

	this.socket.onMessage((msg) => {
	  if (msg.data.includes("keepalive")) {
	 	// send a keep alive back?
		console.log("keep alive message recieved.");
	  } else {
	  	this.listener.emit({ "type": MESSAGE, "data": msg });
	  }
	}, {autoApply: false}
	);
	
	this.socket.onOpen((msg) => {
		console.log("websocket opened", msg);	
	});

	this.socket.onError((msg) => {
		console.log("websocket closed.", msg);	
	});
	
	this.socket.onClose((msg) => {
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

export const OPEN: string = "open";
export const CLOSE: string = "close";
export const MESSAGE: string = "message";
