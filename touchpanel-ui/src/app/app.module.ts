import { BrowserModule, HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import 'hammerjs';
import { CookieModule } from 'ngx-cookie';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { MdSliderModule } from '@angular/material';

import { AppComponent } from './app.component';
import { ModalComponent } from './modal.component';
import { SocketService } from './socket.service';
import { APIService } from './api.service';

@NgModule({
  declarations: [
    AppComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot(),
    BrowserAnimationsModule,
	CookieModule.forRoot(),
	SimpleNotificationsModule.forRoot(),
    MdSliderModule
  ],
  providers: [SocketService, APIService],
  bootstrap: [AppComponent]
})
export class AppModule { }
