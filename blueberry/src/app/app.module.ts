import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule, MatIconModule, MatButtonModule, MatMenuModule, MatDialogModule, MatGridListModule, MatChipsModule } from '@angular/material';
import { UiSwitchModule } from 'ngx-ui-switch';
import 'hammerjs';

import { AppComponent } from './components/app.component';
import { HomeComponent } from './components/home.component';
import { WheelComponent } from './components/wheel.component';
import { ManagementComponent } from './components/management.component';
import { HelpDialog } from './dialogs/help.dialog';
import { APIService } from './services/api.service';
import { SocketService } from './services/socket.service';
import { CommandService } from './services/command.service';
import { DataService } from './services/data.service';

@NgModule({
  declarations: [
    HelpDialog,
    AppComponent,
    HomeComponent,
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
    UiSwitchModule,
  ],
  providers: [
	  APIService,
	  SocketService,
	  CommandService,
      DataService
  ],
  entryComponents: [
      HelpDialog,
  ],
  bootstrap: [
      AppComponent,
  ]
})
export class AppModule { }
