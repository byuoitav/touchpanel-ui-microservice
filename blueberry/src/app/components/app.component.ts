import {
  Component,
  ViewChild} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";

import { APIService } from "../services/api.service";
import { CommandService } from "../services/command.service";
import { SocketService } from "../services/socket.service";
import { HomeComponent } from "./home.component";
import { AudioComponent } from "./audio/audio.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss", "../colorscheme.scss"]
})
export class AppComponent {
  @ViewChild(HomeComponent)
  public home: HomeComponent;
  public unlocking = false;

  public location = window.location;

  @ViewChild(AudioComponent)
  public audio: AudioComponent;

  constructor(
    private api: APIService,
    public socket: SocketService,
    public command: CommandService,
    private dialog: MatDialog
  ) {}

  public unlock() {
    if (this.home.wheel == null) {
      return;
    }

    this.unlocking = true;
    this.home.turnOn().subscribe(success => {
      if (!success) {
        console.log("failed to turn on");
        this.unlocking = false;
      } else {
        setTimeout(() => (this.unlocking = false), 1000);
      }
    });
  }

  showManagement = (): boolean => {
    if (this.dialog.openDialogs.length > 0) {
      return false;
    }

    // added this check to prevent errors with undefined home
    if (this.home == undefined || this.home == null) {
      return true;
    }

    //console.log("showManagement", this.home);

    if (this.home.audio && this.home.audio.isShowing()) {
      return false;
    }

    if (!this.home) {
      return true;
    }

    if (!this.home.wheel) {
      return true;
    }

    if (this.home.wheel.getPower() === "standby") {
      return true;
    }

    return false;
  };
}