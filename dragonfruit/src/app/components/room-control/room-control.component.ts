import { Component, OnInit, HostListener } from '@angular/core';
import { BFFService } from 'src/app/services/bff.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Preset } from 'src/app/objects/database';
import { ControlGroup } from 'src/app/objects/control';
import { MatTabChangeEvent, MatTab } from '@angular/material';

@Component({
  selector: 'app-room-control',
  templateUrl: './room-control.component.html',
  styleUrls: ['./room-control.component.scss']
})
export class RoomControlComponent implements OnInit {
  controlGroup: ControlGroup;
  groupIndex: number;
  roomID: string;

  tabPosition = 'below';
  selectedTab: string;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (window.innerWidth >= 768) {
      this.tabPosition = 'above';
    } else {
      this.tabPosition = 'below';
    }
  }

  constructor(
    public bff: BFFService,
    public route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe(params => {
      this.roomID = params['id'];
      this.groupIndex = params['index'];
      this.selectedTab = params['tabName'];
      // console.log(this.roomID);
      if (this.bff.room === undefined) {
        this.bff.setupRoom(this.roomID);
      } else {
        this.controlGroup = this.bff.room.controlGroups[this.groupIndex];
      }

      this.bff.done.subscribe(() => {
        this.controlGroup = this.bff.room.controlGroups[this.groupIndex];
        if (this.bff.room.selectedGroup === undefined) {
          this.bff.room.selectedGroup = this.controlGroup.name;
        }
      });
    });
  }

  ngOnInit() {
    if (window.innerWidth >= 768) {
      this.tabPosition = 'above';
    } else {
      this.tabPosition = 'below';
    }
  }

  goBack = () => {
    this.router.navigate(['/room/' + this.roomID]);
  }

  tabChange(tabName: string) {
    this.selectedTab = tabName;
    const currentURL = window.location.pathname;
    const newURL = currentURL.substr(0, currentURL.lastIndexOf('/') + 1) + (this.selectedTab);
    this.router.navigate([newURL]);
  }
}
