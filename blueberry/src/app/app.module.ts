import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { WheelComponent } from './wheel.component';
import { APIService } from './api.service';
import { SocketService } from './socket.service';

@NgModule({
  declarations: [
    AppComponent,
	WheelComponent
  ],
  imports: [
    BrowserModule,
	HttpModule,
  ],
  providers: [
	  APIService,
	  SocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
