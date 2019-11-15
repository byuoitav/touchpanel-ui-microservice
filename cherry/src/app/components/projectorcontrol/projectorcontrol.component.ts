import { Component, OnInit } from '@angular/core';
import { MatTabGroup } from "@angular/material/tabs";
import { Preset } from "../../objects/objects";
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
  preset: Preset;
  @Input()
  pages: number[] = [];
  curPage: number;
  displayPages: number[] = [];
  curDisplayPage: number;

  groupPages: Map<string, number[]> = new Map();
  groupCurPage: Map<string, number> = new Map();
  
  constructor() { }

  ngOnInit() {
  }

}
