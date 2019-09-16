import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { BFFService } from 'src/app/services/bff.service';
import { HelpInfoComponent } from './help-info/help-info.component';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
  helpHasBeenSent = false;
  // TODO: figure out how to track the status of the help request and stuff

  constructor(
    private dialog: MatDialog,
    private bff: BFFService
  ) { }

  ngOnInit() {
  }

  sendForHelp = () => {
    this.dialog.open(HelpInfoComponent, {}).afterClosed().subscribe((info) => {
      if (info) {
        this.helpHasBeenSent = true;
      }
    });
  }
}
