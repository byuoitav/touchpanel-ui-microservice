import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpModule } from "@angular/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  MatSliderModule,
  MatIconModule,
  MatButtonModule,
  MatMenuModule,
  MatDialogModule,
  MatGridListModule,
  MatChipsModule,
  MatProgressSpinnerModule
} from "@angular/material";
import { UiSwitchModule } from "ngx-ui-switch";
import { SweetAlert2Module } from "@toverux/ngx-sweetalert2";
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
    ShareModalComponent
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
    MatProgressSpinnerModule,
    UiSwitchModule,
    SweetAlert2Module.forRoot()
  ],
  providers: [
    APIService,
    SocketService,
    CommandService,
    DataService,
    GraphService
  ],
  entryComponents: [
    HelpModal,
    ConfirmHelpModal,
    PowerOffAllModalComponent,
    ShareModalComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
