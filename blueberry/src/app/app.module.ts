import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule, MatIconModule, MatButtonModule, MatMenuModule, MatDialogModule, MatGridListModule, MatChipsModule } from '@angular/material';
import { UiSwitchModule } from 'ngx-ui-switch';
import { SweetAlert2Module } from '@toverux/ngx-sweetalert2';
import { SimpleNotificationsModule } from 'angular2-notifications';
import 'hammerjs';

import { AppComponent } from './components/app.component';
import { HomeComponent } from './components/home.component';
import { WheelComponent } from './components/wheel.component';
import { AdvancedComponent } from './components/advanced.component';
import { SpringboardComponent } from './components/springboard.component';
import { ManagementComponent } from './components/management.component';
import { HelpDialog } from './dialogs/help.dialog';
import { ChangedDialog } from './dialogs/changed.dialog';
import { APIService } from './services/api.service';
import { SocketService } from './services/socket.service';
import { CommandService } from './services/command.service';
import { DataService } from './services/data.service';
import { GraphService } from './services/graph.service';

@NgModule({
  declarations: [
    HelpDialog,
    ChangedDialog,
    AppComponent,
    HomeComponent,
	WheelComponent,
    ManagementComponent,
    AdvancedComponent,
    SpringboardComponent,
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
    SweetAlert2Module.forRoot(),
    SimpleNotificationsModule.forRoot(),
  ],
  providers: [
	  APIService,
	  SocketService,
	  CommandService,
      DataService,
      GraphService,
  ],
  entryComponents: [
      HelpDialog,
      ChangedDialog,
  ],
  bootstrap: [
      AppComponent,
  ]
})
export class AppModule { }
