import { Component, OnInit } from '@angular/core';
import { BFFService } from 'src/app/services/bff.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Preset } from 'src/app/objects/database';
import { ControlGroup } from 'src/app/objects/control';

@Component({
  selector: 'app-room-control',
  templateUrl: './room-control.component.html',
  styleUrls: ['./room-control.component.scss']
})
export class RoomControlComponent implements OnInit {
  controlGroup: ControlGroup;
  groupIndex: number;
  roomID: string;

  constructor(
    public bff: BFFService,
    public route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe(params => {
      this.roomID = params['id'];
      this.groupIndex = params['index'];
      console.log(this.roomID);
      if (this.bff.room === undefined) {
        this.bff.setupRoom(this.roomID);
      }

      this.bff.done.subscribe(() => {
        this.controlGroup = this.bff.room.controlGroups[this.groupIndex];
      });
    });
  }

  ngOnInit() {
  }

  goBack = () => {
    this.router.navigate(['/room/' + this.roomID]);
  }

}
