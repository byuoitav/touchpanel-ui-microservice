import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule, MatIconModule, MatButtonModule, MatMenuModule, MatDialogModule, MatGridListModule, MatChipsModule } from '@angular/material';
import { UiSwitchModule } from 'ngx-ui-switch';
import 'hammerjs';

import { AppComponent } from './components/app.component';
import { WheelComponent } from './components/wheel.component';
import { ManagementComponent } from './components/management.component';
import { ShareScreenDialog } from './dialogs/sharescreen.dialog';
import { APIService } from './services/api.service';
import { SocketService } from './services/socket.service';
import { CommandService } from './services/command.service';

@NgModule({
  declarations: [
    ShareScreenDialog,
    AppComponent,
	WheelComponent,
    ManagementComponent,
  ],
  imports: [
    BrowserModule,
	HttpModule,
    BrowserAnimationsModule,
    MatSliderModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatGridListModule,
    MatChipsModule,
    UiSwitchModule
  ],
  providers: [
	  APIService,
	  SocketService,
	  CommandService
  ],
  bootstrap: [
      AppComponent, 
      ShareScreenDialog
  ]
})
export class AppModule { }
