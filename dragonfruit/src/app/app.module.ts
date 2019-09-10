import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import {
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  MatButtonToggleModule,
  MatBottomSheetModule,
  MatToolbarModule,
  MatSliderModule,
  MatDialogModule
} from '@angular/material';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BFFService } from './services/bff.service';
import { LoginComponent } from './components/login/login.component';
import { NumpadComponent } from './dialogs/numpad/numpad.component';
import { SquareButtonComponent } from './components/square-button/square-button.component';
import { VolumeSliderComponent } from './components/volume-slider/volume-slider.component';
import { DisplayDialogComponent } from './dialogs/display-dialog/display-dialog.component';
import { RoomControlComponent } from './components/room-control/room-control.component';
import { SelectionComponent } from './components/selection/selection.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NumpadComponent,
    SquareButtonComponent,
    VolumeSliderComponent,
    DisplayDialogComponent,
    RoomControlComponent,
    SelectionComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatButtonModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonToggleModule,
    MatToolbarModule,
    MatSliderModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatBottomSheetModule,
    HttpClientModule
  ],
  providers: [
    BFFService
  ],
  entryComponents: [
    NumpadComponent,
    DisplayDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
