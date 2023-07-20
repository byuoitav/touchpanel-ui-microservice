import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {HttpClientModule} from "@angular/common/http";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {
  MatTabsModule,
  MatSliderModule,
  MatButtonModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatDialogModule,
  MatIconModule,
  MatGridListModule,
} from "@angular/material";
import "hammerjs";

import {AppComponent} from "./components/app.component";
import {DisplayComponent} from "./components/display/display.component";
import {VolumeComponent} from "./components/volume/volume.component";
import {AudiocontrolComponent} from "./components/audiocontrol/audiocontrol.component";

import {HelpDialog} from "./dialogs/help.dialog";
import {ConfirmHelpDialog} from "./dialogs/confirmhelp.dialog";
import {ViaDialog} from "./dialogs/via.dialog";
import { AudioDialog } from "./dialogs/audio.dialog";

import {APIService} from HttpClientModulenent} from "./components/management/management.component";
import {StreamModalComponent} from "./dialogs/streammodal/streammodal.component";
import {CameraControlComponent} from './components/camera-control/camera-control.component';
import { RecordingComponent } from './components/recording/recording.component';

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
  ],
  providers: [
    APIService,
    CommandService,
    DataService,
    GraphService,
    SocketService
  ],
  entryComponents: [HelpDialog, ConfirmHelpDialog, ViaDialog, StreamModalComponent, AudioDialog],
  bootstrap: [AppComponent]
})
export class AppModule {}
