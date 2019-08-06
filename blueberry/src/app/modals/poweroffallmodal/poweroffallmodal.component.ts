import { Component, OnInit, EventEmitter, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

import { APIService } from "../../services/api.service";
import { CommandService } from "../../services/command.service";
import {
  Event,
  BasicDeviceInfo,
  BasicRoomInfo
} from "../../services/socket.service";
import { POWER_OFF_ALL } from "../../objects/status.objects";

@Component({
  selector: "poweroffallmodal",
  templateUrl: "./poweroffallmodal.component.html",
  styleUrls: ["./poweroffallmodal.component.scss"]
})
export class PowerOffAllModalComponent implements OnInit {
  constructor(
    public ref: MatDialogRef<PowerOffAllModalComponent>,
    public api: APIService,
    public command: CommandService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private turnOff: () => EventEmitter<boolean>
  ) {}

  ngOnInit() {}

  public cancel() {
    this.command.buttonPress("cancel power off all");
    this.ref.close();
  }

  powerOffThisDisplay = async (): Promise<boolean> => {
    this.command.buttonPress("power off");

    return new Promise<boolean>((resolve, reject) => {
      console.log("powering off this display");

      this.turnOff().subscribe(success => {
        resolve(success);
      });
    });
  };

  powerOffAllDisplays = async (): Promise<boolean> => {
    this.command.buttonPress("power off all");

    return new Promise<boolean>((resolve, reject) => {
      this.turnOff().subscribe(success => {
        if (success) {
          this.command.powerOffAll().subscribe(suc => {
            if (suc) {
              const event = new Event();

              event.User = APIService.piHostname;
              event.EventTags = ["ui-communication"];
              event.AffectedRoom = new BasicRoomInfo(
                APIService.building + "-" + APIService.roomName
              );
              event.TargetDevice = new BasicDeviceInfo(APIService.piHostname);
              event.Key = POWER_OFF_ALL;
              event.Value = " ";

              this.api.sendEvent(event);
            }

            resolve(suc);
          });
        } else {
          resolve(success);
        }
      });

      console.log("sending power off all");
    });
  };
}
