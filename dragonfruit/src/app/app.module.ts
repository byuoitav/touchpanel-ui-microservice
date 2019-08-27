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
  MatToolbarModule
} from '@angular/material';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BFFService } from './services/bff.service';
import { LoginComponent } from './components/login/login.component';
import { DisplayComponent } from './components/display/display.component';
import { MultiDisplayComponent } from './components/multi-display/multi-display.component';
import { NumpadComponent } from './dialogs/numpad/numpad.component';
import { IOButtonComponent } from './components/io-button/io-button.component';
import { FooterComponent } from './components/footer/footer.component';
import { FooterButtonComponent } from './components/footer-button/footer-button.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DisplayComponent,
    MultiDisplayComponent,
    NumpadComponent,
    IOButtonComponent,
    FooterComponent,
    FooterButtonComponent
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
    ReactiveFormsModule,
    MatBottomSheetModule,
    HttpClientModule
  ],
  providers: [
    BFFService
  ],
  entryComponents: [
    NumpadComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
