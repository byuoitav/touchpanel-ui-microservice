import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';

import { APIService } from './api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [APIService]
})
export class AppComponent {
	messages: Array<any>;

	public constructor(private socket: SocketService, private api: APIService) {
		this.messages = [];
	}

	public ngOnInit() {
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

		this.api.setup("ITB", "1101");
	} 

	public ngOnDestroy() {
		this.socket.close();
	}
}
