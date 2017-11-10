import { Component, OnInit, ViewChild, ElementRef, ComponentRef } from '@angular/core';
import { MatDialog } from '@angular/material';

import { APIService } from '../services/api.service';
import { DataService } from '../services/data.service';
import { Preset, Panel } from '../objects/objects';
import { Device, Input, Output, Display, AudioDevice, POWER, INPUT, BLANKED, MUTED, VOLUME } from '../objects/status.objects';
import { WheelComponent } from './wheel.component';
import { HelpDialog } from '../dialogs/help.dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', '../colorscheme.scss'],
})
export class AppComponent {

    public locked: boolean = true;

    @ViewChild(WheelComponent)
    private wheel: WheelComponent;

	constructor (private api: APIService, private data: DataService, private dialog: MatDialog) {}

    public unlock() {
        this.wheel.command.setPower('on', this.wheel.preset.displays);

        this.locked = false;
        setTimeout(() => {
            this.wheel.open(false);
        }, 1000); // duration of transition
    }

    public lock() {
        this.locked = true;
    }

    public help() {
        let dialogRef = this.dialog.open(HelpDialog, {
            width: '50vw',
            backdropClass: 'dialog-backdrop'
        });

        dialogRef.afterClosed().subscribe(result => {
        });
    }

    private onWheelInit() {
        this.wheel.preset.top = "50vh";
        this.wheel.preset.right = "50vw";
    }
}
