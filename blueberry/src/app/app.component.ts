import { Component, OnInit } from '@angular/core';

import { APIService } from './api.service';
import { SocketService } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [APIService],
})
export class AppComponent implements OnInit {

	constructor (private api: APIService, private socket: SocketService) {
	}

	public ngOnInit() {
	}

	// app component sets up the devices from the api's information
	// wheel component stores that information (the output displays, at least)
	// another component sends the commands
	// app component updates the displays with info from the socket?
}
