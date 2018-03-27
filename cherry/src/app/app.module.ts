import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { HttpModule } from '@angular/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import {
    MatTabsModule,
} from '@angular/material'
import 'hammerjs'

import { AppComponent } from './components/app.component'
import { DisplayComponent } from './components/display/display.component'
import { APIService } from './services/api.service'
import { CommandService } from './services/command.service'
import { DataService } from './services/data.service'
import { GraphService } from './services/graph.service'
import { SocketService } from './services/socket.service'

@NgModule({
  declarations: [
    AppComponent,
    DisplayComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    MatTabsModule,
  ],
  providers: [
      APIService,
      CommandService,
      DataService,
      GraphService,
      SocketService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
