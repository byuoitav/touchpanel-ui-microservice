import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';
import { Observable } from 'rxjs/Rx';

import { APIService } from './api.service';
import { Room, RoomConfiguration, RoomStatus } from './objects';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [APIService]
})
export class AppComponent {
	messages: Array<any>;
	room: Room;

	public constructor(private socket: SocketService, private api: APIService) {
		this.messages = [];
	}

	public ngOnInit() {
		this.api.setup("ITB", "1101");
		this.room = new Room();
		this.getData();

		this.socket.getEventListener().subscribe(event => {
			if(event.type == MESSAGE) {
				let data = event.data.data;
				console.log(data);
				this.messages.push(data);
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
