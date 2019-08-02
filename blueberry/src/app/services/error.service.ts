import { Injectable } from "@angular/core";
import { APIService } from "./api.service";
import { MatDialog } from "@angular/material";
import { ErrorModalComponent } from "app/modals/errormodal/errormodal.component";

export enum CommandType {
  PowerOn = 0,
  PowerOff = 1,
  SwitchInput = 2,
  SetVolume = 3,
  SetMute = 4,
  BlankDisplay = 5,
  Share = 6,
  Unshare = 7,
  Mirror = 8
}

@Injectable()
export class ErrorService {
  private _errorTitles = [
    "System offline",
    "System offline",
    "Unable to switch input",
    "Unable to set volume",
    "Unable to mute display",
    "Unable to blank display",
    "Unable to share to other displays",
    "Unable to stop sharing",
    "Unable to mirror display"
  ];

  private _errorBodies = [
    "There is a problem and this room's system is offline. Technicians have been notified. Call our helpdesk at 801-422-7671 for more information.",
    "There is a problem and this room's system is offline. Technicians have been notified. Call our helpdesk at 801-422-7671 for more information.",
    "There is a problem and the input cannot be changed. Technicians have been notified. Please feel free to continue to use the functioning parts of the system. Call our helpdesk at 801-422-7671 for more information.",
    "There is a problem and the volume cannot be set. Technicians have been notified. Please feel free to continue to use the functioning parts of the system. Call our helpdesk at 801-422-7671 for more information.",
    "There is a problem and the display could not be muted. Technicians have been notified. Please feel free to continue to use the functioning parts of the system. Call our helpdesk at 801-422-7671 for more information.",
    "There is a problem and the display cannot be blanked. Technicians have been notified. Please feel free to continue to use the functioning parts of the system. Call our helpdesk at 801-422-7671 for more information.",
    "There is a problem and the input cannot be shared to other displays. Technicians have been notified. Please feel free to continue to use the functioning parts of the system. Call our helpdesk at 801-422-7671 for more information.",
    "There is a problem and I cannot stop sharing because I love it. Technicians have been notified. Please feel free to continue to use the functioning parts of the system. Call our helpdesk at 801-422-7671 for more information.",
    "There is a problem and the display cannot mirror another one. Technicians have been notified. Please feel free to continue to use the functioning parts of the system. Call our helpdesk at 801-422-7671 for more information."
  ];

  constructor(private api: APIService, private dialog: MatDialog) {}

  public show = (cmdType: CommandType, errDetails: any) => {
    this.dialog.open(ErrorModalComponent, {
      data: {
        headerMessage: this._errorTitles[cmdType],
        bodyMessage: this._errorBodies[cmdType],
        errorMessage: errDetails
      }});

      // TODO: send event to SMEE
  }
}
