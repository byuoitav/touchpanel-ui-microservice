import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpModule } from "@angular/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  MatTabsModule,
  MatSliderModule,
  MatButtonModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatDialogModule
} from "@angular/material";
import "hammerjs";

import { AppComponent } from "./components/app.component";
import { DisplayComponent } from "./components/display/display.component";
import { VolumeComponent } from "./components/volume/volume.component";
import { AudiocontrolComponent } from "./components/audiocontrol/audiocontrol.component";

import { HelpDialog } from "./dialogs/help.dialog";
import { ConfirmHelpDialog } from "./dialogs/confirmhelp.dialog";
import { ViaDialog } from "./dialogs/via.dialog";

import { APIService } from "./services/api.service";
import { CommandService } from "./services/command.service";
import { DataService } from "./services/data.service";
import { GraphService } from "./services/graph.service";
import { SocketService } from "./services/socket.service";
import { ManagementComponent } from "./components/management/management.component";

@NgModule({
  declarations: [
    AppComponent,
    DisplayComponent,
    VolumeComponent,
    AudiocontrolComponent,
    ManagementComponent,

    HelpDialog,
    ConfirmHelpDialog,
    ViaDialog
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    MatTabsModule,
    MatSliderModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  providers: [
    APIService,
    CommandService,
    DataService,
    GraphService,
    SocketService
  ],
  entryComponents: [HelpDialog, ConfirmHelpDialog, ViaDialog],
  bootstrap: [AppComponent]
})
export class AppModule {}
