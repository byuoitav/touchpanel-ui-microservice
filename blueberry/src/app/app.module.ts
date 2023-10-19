import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { MatSliderModule } from "@angular/material/slider";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatDialogModule } from "@angular/material/dialog";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatChipsModule } from "@angular/material/chips";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { UiSwitchModule } from "ngx-ui-switch";
import { SweetAlert2Module } from "@sweetalert2/ngx-sweetalert2";
import "hammerjs";

import { AppComponent } from "./components/app.component";
import { HomeComponent } from "./components/home.component";
import { WheelComponent } from "./components/wheel.component";
import { ManagementComponent } from "./components/management.component";
import { APIService } from "./services/api.service";
import { SocketService } from "./services/socket.service";
import { CommandService } from "./services/command.service";
import { DataService } from "./services/data.service";
import { GraphService } from "./services/graph.service";
import { HelpModal } from "./modals/helpmodal/helpmodal.component";
import { ConfirmHelpModal } from "./modals/confirmhelpmodal/confirmhelpmodal.component";
import { PowerOffAllModalComponent } from "./modals/poweroffallmodal/poweroffallmodal.component";
import { ActivityButtonComponent } from "./components/activity-button/activity-button.component";
import { ShareModalComponent } from "./modals/sharemodal/sharemodal.component";
import { AudioComponent } from "./components/audio/audio.component";
import { VolumeComponent } from "./components/volume/volume.component";
import { MirrorModalComponent } from "./modals/mirrormodal/mirrormodal.component";
import { MessageModalComponent } from "./modals/messagemodal/messagemodal.component";
import { StreamModalComponent } from "./modals/streammodal/streammodal.component";
import { NgxSliderModule } from '@angular-slider/ngx-slider';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    WheelComponent,
    ManagementComponent,
    HelpModal,
    ConfirmHelpModal,
    PowerOffAllModalComponent,
    ActivityButtonComponent,
    ShareModalComponent,
    AudioComponent,
    MirrorModalComponent,
    MessageModalComponent,
    VolumeComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatSliderModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatGridListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    UiSwitchModule,
    SweetAlert2Module.forRoot(),
    StreamModalComponent,
    NgxSliderModule
  ],
  providers: [
    APIService,
    SocketService,
    CommandService,
    DataService,
    GraphService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
