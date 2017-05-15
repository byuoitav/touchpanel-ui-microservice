import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
	messages: Array<any>;
	hi: string;

	public constructor(private socket: SocketService) {
		this.messages = [];
	}

	public ngOnInit() {
		this.socket.getEventListener().subscribe(event => {
			if(event.type == "message") {
				let data = event.data.data;
				console.log(data);
				this.messages.push(data);
			} else if(event.type == "close") {
				this.messages.push("/The socket connection has been closed");
			} else if(event.type == "open") {
				this.messages.push("/The socket connection has been opened");
			}
		})	
	} 

	public ngOnDestroy() {
		this.socket.close();
	}

  title = 'app works!';
}
