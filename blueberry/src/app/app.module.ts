import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material';
import { UiSwitchModule } from 'ngx-ui-switch';
import 'hammerjs';

import { AppComponent } from './app.component';
import { WheelComponent } from './wheel.component';
import { APIService } from './api.service';
import { SocketService } from './socket.service';
import { CommandService } from './command.service';

@NgModule({
  declarations: [
    AppComponent,
	WheelComponent,
  ],
  imports: [
    BrowserModule,
	HttpModule,
    BrowserAnimationsModule,
    MatSliderModule,
    UiSwitchModule
  ],
  providers: [
	  APIService,
	  SocketService,
	  CommandService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
