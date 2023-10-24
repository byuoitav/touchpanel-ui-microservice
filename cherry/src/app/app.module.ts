import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSliderModule } from "@angular/material/slider";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatGridListModule } from "@angular/material/grid-list";

import "hammerjs";

import { AppComponent } from "./components/app.component";
import { DisplayComponent } from "./components/display/display.component";
import { VolumeComponent } from "./components/volume/volume.component";
import { AudiocontrolComponent } from "./components/audiocontrol/audiocontrol.component";

import { HelpDialog } from "./dialogs/help.dialog";
import { ConfirmHelpDialog } from "./dialogs/confirmhelp.dialog";
import { ViaDialog } from "./dialogs/via.dialog";
import { AudioDialog } from "./dialogs/audio.dialog";

import { APIService } from "./services/api.service";
import { CommandService } from "./services/command.service";
import { DataService } from "./services/data.service";
import { GraphService } from "./services/graph.service";
import { SocketService } from "./services/socket.service";
import { ManagementComponent } from "./components/management/management.component";
import { StreamModalComponent } from "./dialogs/streammodal/streammodal.component";
import { CameraControlComponent } from './components/camera-control/camera-control.component';
import { RecordingComponent } from './components/recording/recording.component';
import { NgxSliderModule } from 'ngx-slider-v2';

@NgModule({
  declarations: [
    AppComponent,
    DisplayComponent,
    VolumeComponent,
    AudiocontrolComponent,
    ManagementComponent,
    HelpDialog,
    ConfirmHelpDialog,
    ViaDialog,
    StreamModalComponent,
    CameraControlComponent,
    RecordingComponent,
    AudioDialog
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatTabsModule,
    MatSliderModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    MatGridListModule,
    NgxSliderModule
  ],
  providers: [
    APIService,
    CommandService,
    DataService,
    GraphService,
    SocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
