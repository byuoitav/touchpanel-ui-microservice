import { Component, OnInit, ViewChild, ElementRef, ComponentRef } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute } from '@angular/router';

import { APIService } from '../services/api.service';
import { DataService } from '../services/data.service';
import { Preset, Panel } from '../objects/objects';
import { Device, Input, Output, Display, AudioDevice, POWER, INPUT, BLANKED, MUTED, VOLUME } from '../objects/status.objects';
import { WheelComponent } from './wheel.component';
import { HomeComponent } from './home.component';
import { ShareScreenDialog } from '../dialogs/sharescreen.dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', '../colorscheme.scss'],
})
export class AppComponent {

    public locked: boolean = true;

    private home: HomeComponent;

	constructor (private api: APIService, private data: DataService, private dialog: MatDialog) {}

    private onActivate(ref: ComponentRef<Component>) {
        if (ref instanceof HomeComponent) {
            this.home = ref;
        } 
    }

    public unlock() {
        this.home.wheel.command.setPower('on', this.home.wheel.preset.displays);

        this.locked = false;
        setTimeout(() => {
            this.home.wheel.open(false);
        }, 1000); // duration of transition
    }

    public lock() {
        this.locked = true;
    }

    public shareScreen() {
        let dialogRef = this.dialog.open(ShareScreenDialog, {
            width: '50vw',
            data: { displays: this.data.displays },
            backdropClass: 'dialog-backdrop'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result != null && result.length > 0) {
                this.home.wheel.command.setInput(Output.getInput(this.home.wheel.preset.displays), result);
            }
        });
    }
}
