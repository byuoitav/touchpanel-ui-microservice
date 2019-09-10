import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BFFService } from 'src/app/services/bff.service';
import { ControlGroup } from 'src/app/objects/control';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {
  roomID = '';

  constructor(
    private route: ActivatedRoute,
    public bff: BFFService,
    private router: Router) {
    this.route.params.subscribe(params => {
      this.roomID = params['id'];
      if (this.bff.room === undefined) {
        this.bff.setupRoom(this.roomID);
      }
    });
  }

  ngOnInit() {
  }

  goBack = () => {
    this.router.navigate(['/login']);
  }

  selectControlGroup = (cg: ControlGroup): Promise<boolean> => {
    return new Promise<boolean>(() => {
      const index = this.bff.room.controlGroups.indexOf(cg);
      this.bff.room.selectedGroup = cg.name;
      this.router.navigate(['/room/' + this.roomID + '/group/' + index]);
    });
  }
}
