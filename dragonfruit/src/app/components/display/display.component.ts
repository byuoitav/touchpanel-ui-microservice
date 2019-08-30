import { Component, OnInit } from '@angular/core';
import { BFFService } from 'src/app/services/bff.service';
import { ActivatedRoute } from '@angular/router';
import { Device, UIConfig, IOConfiguration } from 'src/app/objects/database';
import { MatDialog } from '@angular/material';
import { DisplayDialogComponent } from 'src/app/dialogs/display-dialog/display-dialog.component';

class Page {
  name: string;
  display: boolean;
}

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit {
  roomID: string;
  devices: Device[];
  uiConfig: UIConfig;

  selectedInput: IOConfiguration;

  page: string = 'Control';

  audioDevices: string[] = [
    'Display',
    'Mic 1',
    'Mic 2'
  ];

  roomOptions: string[] = [
    'ITB-1101-VIA1 (Wireless Presentation)',
    'ITB-1101-HDMI1 (HDMI Jack)'
  ];

  boxPresentations: string[] = [
    'My Presentation',
    'Another Presentation',
    'A Third Presentation'
  ];

  constructor(public bff: BFFService,
    public route: ActivatedRoute,
    public dialog: MatDialog) {
    this.route.params.subscribe(params => {
      this.roomID = params['id'];
    });

    // Temporarily disable info getting
    // this.getRoomInfo();
  }

  ngOnInit() {
  }

  getRoomInfo() {
    this.bff.getUIConfig(this.roomID).then((answer) => {
      this.uiConfig = answer as UIConfig;
      console.log(this.uiConfig);
    });

    this.bff.getDevicesInRoom(this.roomID).then((answer) => {
      this.devices = answer as Device[];
      console.log(this.devices);
    });
  }

  selectInput() {
    console.log("Input button pressed!");
  }

  changePage(page: string) {
    this.page = page;
  }

  //TEST
  openDisplayDialog() {
    const dialogRef = this.dialog.open(DisplayDialogComponent, {
      width: '100vw',
      panelClass: 'dialog-no-padding',
      data: { displayName: 'D1', displayIcon: 'tv' }
    });
  }

}
