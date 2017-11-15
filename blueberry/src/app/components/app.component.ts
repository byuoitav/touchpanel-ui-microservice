import { Component, OnInit, ViewChild, ElementRef, ComponentRef } from '@angular/core';

import { APIService } from '../services/api.service';
import { DataService } from '../services/data.service';
import { Preset, Panel } from '../objects/objects';
import { Device, Input, Output, Display, AudioDevice, POWER, INPUT, BLANKED, MUTED, VOLUME } from '../objects/status.objects';
import { HomeComponent } from './home.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', '../colorscheme.scss'],
})
export class AppComponent {

    @ViewChild(HomeComponent)
    private home: HomeComponent;

	constructor (private api: APIService, private data: DataService) {}

    public unlock() {
        this.home.turnOn().subscribe(success => {
            if (!success) {
                console.log("failed to turn on"); 
                setTimeout(() => this.unlock, 1000);
            }
        });
    }
}
