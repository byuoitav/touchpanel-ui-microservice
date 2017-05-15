import { Injectable, EventEmitter } from '@angular/core'

@Injectable()
export class SocketService {
	private socket: WebSocket;
	private listener: EventEmitter<any> = new EventEmitter();

	public constructor() {
		this.socket = new WebSocket("ws://localhost:7003");

		this.socket.onopen = event => {
			this.listener.emit({"type": "open", "data": event});
		}

		this.socket.onclose = event => {
			this.listener.emit({"type": "close", "data": event});
		}

		this.socket.onmessage = event => {
			console.log("Message recieved");
			console.log(event);
			this.listener.emit({"type": "messsage", "data": event});
		}
	}

	public close() {
		this.socket.close();
	}

	public getEventListener() {
		return this.listener;
	}
}
