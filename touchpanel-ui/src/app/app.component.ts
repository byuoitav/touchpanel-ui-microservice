import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService, OPEN, CLOSE, MESSAGE } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
	messages: Array<any>;

	public constructor(private socket: SocketService) {
		this.messages = [];
	}

	public ngOnInit() {
		this.socket.getEventListener().subscribe(event => {
			console.log("event.type =", event.type);
			console.log("event.data =", event.data);
			if(event.type == MESSAGE) {
				console.log("got the event type of message!")
				let data = event.data.data;
				console.log(data);
				this.messages.push(data);
			} else if(event.type == CLOSE) {
				this.messages.push("/The socket connection has been closed");
			} else if(event.type == OPEN) {
				this.messages.push("/The socket connection has been opened");
			}
		})	
	} 

	public ngOnDestroy() {
		this.socket.close();
	}
}
