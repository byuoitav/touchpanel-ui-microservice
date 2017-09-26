import { Component } from '@angular/core';

import { APIService } from './api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [APIService],
})
export class AppComponent {

	constructor (private api: APIService) {
	}
}
