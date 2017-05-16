import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus, Event } from './objects';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [APIService, SocketService]
})
export class AppComponent {
	messages: Array<any>;
	events: Array<Event>;
	room: Room;

	public constructor(private socket: SocketService, private api: APIService) {
		this.messages = [];
		this.events = [];
	}

	public ngOnInit() {
		this.api.setup("ITB", "1101");
		this.room = new Room();
		this.getData();

		this.socket.getEventListener().subscribe(event => {
			if(event.type == MESSAGE) {
				let data = JSON.parse(event.data.data);
				
				let e = new Event();
				Object.assign(e, data);
				this.events.push(e);

				// do stuff with event
				this.updateUI(e);
			} else if(event.type == CLOSE) {
				this.messages.push("The socket connection has been closed");
			} else if(event.type == OPEN) {
				this.messages.push("The socket connection has been opened");
			}
		})	
	} 

	public ngOnDestroy() {
		this.socket.close();
	}

	updateUI(e: Event) {
		console.log("update ui based on event:", e);	

		switch(e.eventInfoKey) {
			case "power":
				break;
			case "volume":
				break;
			default:
				console.log("unknown eventInfoKey:", e.eventInfoKey);
				break;
		}
	}

	getData()  {
		this.api.getRoomConfig().subscribe(data => {
			this.room.config = new RoomConfiguration();
			Object.assign(this.room.config, data);
			console.log("roomconfig:", this.room.config);
		});

		this.api.getRoomStatus().subscribe(data => {
			this.room.status = new RoomStatus();
			Object.assign(this.room.status, data);
			console.log("roomstatus:", this.room.status);	
		})
	}
}
