import { Component, OnInit } from '@angular/core';
import { MatTabGroup } from "@angular/material/tabs";
import { ProjectorPreset } from "../../objects/objects";
import {
  Input,
  ViewChild,
} from "@angular/core";

@Component({
  selector: 'app-projectorcontrol',
  templateUrl: './projectorcontrol.component.html',
  styleUrls: ['./projectorcontrol.component.scss']
})
export class ProjectorcontrolComponent implements OnInit {

  @ViewChild("tabs")
  tabs: MatTabGroup;
  @Input()
  projectorPreset: ProjectorPreset;
  constructor() { }

  ngOnInit() {
  }

}
