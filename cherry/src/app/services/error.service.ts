import { Injectable } from "@angular/core";
import { APIService } from "./api.service";
import { MatDialog } from "@angular/material";
import { ErrorDialogComponent } from "../dialogs/error/error.component";
import { ErrorMessage } from "../objects/objects";


export const PowerOn = "power-on";
export const PowerOff = "power-off";
export const SwitchInput = "set-input";
export const SetVolume = "set-volume";
export const SetMute = "set-mute";
export const BlankDisplay = "set-blank";
export const MasterMute = "set-master-mute";
export const MixLevel = "set-mix-level";
export const MixMute = "set-mix-mute";

@Injectable()
export class ErrorService {
  errorAlreadyShowing = false;

  private _errorMessages: Map<string, ErrorMessage>;

  constructor(private api: APIService, private dialog: MatDialog) {
    this.api.getErrorMessageConfig().subscribe((answer) => {
      this._errorMessages = answer as Map<string, ErrorMessage>;
      console.log("error messages", this._errorMessages);
    });
  }

  public show = (cmdType: string, errDetails: any) => {
    if (!this.errorAlreadyShowing) {
      this.errorAlreadyShowing = true;
      this.dialog.open(ErrorDialogComponent, {
        data: {
          headerMessage: this._errorMessages[cmdType].title,
          bodyMessage: this._errorMessages[cmdType].body,
          errorMessage: errDetails
        }}).afterClosed().subscribe(() => {
          this.errorAlreadyShowing = false;
        });
    }

      // TODO: send event to SMEE
  }
}
