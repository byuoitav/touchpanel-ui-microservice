import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MdSliderModule } from '@angular/material';
import 'hammerjs';

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
    MdSliderModule
  ],
  providers: [SocketService, APIService],
  bootstrap: [AppComponent]
})
export class AppModule { }
