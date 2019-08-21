import { Injectable } from "@angular/core";
import { APIService } from "./api.service";
import { MatDialog } from "@angular/material";
import { ErrorModalComponent } from "app/modals/errormodal/errormodal.component";
import { ErrorMessage } from "app/objects/objects";


export const PowerOn = "power-on";
export const PowerOff = "power-off";
export const SwitchInput = "set-input";
export const SetVolume = "set-volume";
export const SetMute = "set-mute";
export const BlankDisplay = "set-blank";
export const Share = "start-sharing";
export const Unshare = "stop-sharing";
export const Mirror = "mirror-fail";

@Injectable()
export class ErrorService {

  private _errorMessages: Map<string, ErrorMessage>;

  constructor(private api: APIService, private dialog: MatDialog) {
    this.api.getErrorMessageConfig().subscribe((answer) => {
      this._errorMessages = answer as Map<string, ErrorMessage>;
      console.log("error messages", this._errorMessages);
    })
  }

  public show = (cmdType: string, errDetails: any) => {
    this.dialog.open(ErrorModalComponent, {
      data: {
        headerMessage: this._errorMessages[cmdType].title,
        bodyMessage: this._errorMessages[cmdType].body,
        errorMessage: errDetails
      }});

      // TODO: send event to SMEE
  }
}
