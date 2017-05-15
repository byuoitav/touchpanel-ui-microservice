import { Injectable, EventEmitter } from '@angular/core'

@Injectable()
export class SocketService {
	private socket: WebSocket;
	private listener: EventEmitter<any> = new EventEmitter();

	public constructor() {
		this.socket = new WebSocket("ws://localhost:8888/websocket");

		this.socket.onopen = event => {
			this.listener.emit({"type": OPEN, "data": event});
		}

		this.socket.onclose = event => {
			this.listener.emit({"type": CLOSE, "data": event});
		}

		this.socket.onmessage = event => {
			console.log("Message recieved");
			console.log(event);
			this.listener.emit({"type": MESSAGE, "data": event});
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
