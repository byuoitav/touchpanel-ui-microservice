import {Component, OnInit, Input, AfterViewInit, ViewChild} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {MatTabGroup} from "@angular/material/tabs";

import {Camera, CameraPreset, Preset} from "../../objects/objects";
import { APIService } from '../../services/api.service';

@Component({
  selector: 'camera-control',
  templateUrl: './camera-control.component.html',
  styleUrls: ['./camera-control.component.scss']
})
export class CameraControlComponent implements OnInit, AfterViewInit {
  @Input() preset: Preset;

  @ViewChild(MatTabGroup)
  private _tabs: MatTabGroup;
  code: string;
  room = APIService.building + "-" + APIService.roomName;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    console.log("cameras", this.preset.cameras);
    this.getControlKey();
    setInterval(() => {
      this.getControlKey();
    }, 120000)
  }

  ngAfterViewInit() {
    // this is disgusting. :(
    // but, it moves the second line of tabs to be left aligned
    this._tabs._elementRef.nativeElement.getElementsByClassName(
      "mat-tab-labels"
    )[0].style.justifyContent = "flex-start";
  }

  tiltUp = (cam: Camera) => {
    console.log("tilting up", cam.tiltUp);
    if (!cam.tiltUp) {
      return;
    }

    this.http.get(cam.tiltUp).subscribe(resp => {
      console.log("resp", resp);
    }, err => {
      console.warn("err", err);
    });
  }

  tiltDown = (cam: Camera) => {
    console.log("tilting down", cam.tiltDown);
    if (!cam.tiltDown) {
      return;
    }

    this.http.get(cam.tiltDown).subscribe(resp => {
      console.log("resp", resp);
    }, err => {
      console.warn("err", err);
    });
  }

  panLeft = (cam: Camera) => {
    console.log("panning left", cam.panLeft);
    if (!cam.panLeft) {
      return;
    }

    this.http.get(cam.panLeft).subscribe(resp => {
      console.log("resp", resp);
    }, err => {
      console.warn("err", err);
    });
  }

  panRight = (cam: Camera) => {
    console.log("panning right", cam.panRight);
    if (!cam.panRight) {
      return;
    }

    this.http.get(cam.panRight).subscribe(resp => {
      console.log("resp", resp);
    }, err => {
      console.warn("err", err);
    });
  }

  panTiltStop = (cam: Camera) => {
    console.log("stopping pan", cam.panTiltStop);
    if (!cam.panTiltStop) {
      return;
    }

    this.http.get(cam.panTiltStop).subscribe(resp => {
      console.log("resp", resp);
    }, err => {
      console.warn("err", err);
    });
  }

  zoomIn = (cam: Camera) => {
    console.log("zooming in", cam.zoomIn);
    if (!cam.zoomIn) {
      return;
    }

    this.http.get(cam.zoomIn).subscribe(resp => {
      console.log("resp", resp);
    }, err => {
      console.warn("err", err);
    });
  }

  zoomOut = (cam: Camera) => {
    console.log("zooming out", cam.zoomOut);
    if (!cam.zoomOut) {
      return;
    }

    this.http.get(cam.zoomOut).subscribe(resp => {
      console.log("resp", resp);
    }, err => {
      console.warn("err", err);
    });
  }

  zoomStop = (cam: Camera) => {
    console.log("stopping zoom", cam.zoomStop);
    if (!cam.zoomStop) {
      return;
    }

    this.http.get(cam.zoomStop).subscribe(resp => {
      console.log("resp", resp);
    }, err => {
      console.warn("err", err);
    });
  }

  selectPreset = (preset: CameraPreset) => {
    console.log("selecting preset", preset.displayName, preset.setPreset);
    if (!preset.setPreset) {
      return;
    }

    this.http.get(preset.setPreset).subscribe(resp => {
      console.log("resp", resp);
    }, err => {
      console.warn("err", err);
    });
  }

  getControlKey = () => {
    this.http
    .get(window.location.protocol + "//" + window.location.host +"/control-key/" + this.room + "/" + this.preset.name)
    .map(response => response.json()).subscribe(
      data => {
        this.code = data.ControlKey;
      }
    )
  }
}
