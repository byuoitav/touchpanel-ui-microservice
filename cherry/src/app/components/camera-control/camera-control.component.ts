import {Component, OnInit, Input} from '@angular/core';

import {Camera, CameraPreset} from "../../objects/objects";

@Component({
  selector: 'camera-control',
  templateUrl: './camera-control.component.html',
  styleUrls: ['./camera-control.component.scss']
})
export class CameraControlComponent implements OnInit {
  @Input() cameras: Camera[];

  constructor() {
    if (!this.cameras) {
      this.cameras = [];

      const cam1 = new Camera();
      cam1.displayName = "front cam"
      cam1.panLeft = "http://alp.byu.edu:8080/10.13.34.8/pan/left"
      cam1.panUp = "http://alp.byu.edu:8080/10.13.34.8/pan/up"
      cam1.panRight = "http://alp.byu.edu:8080/10.13.34.8/pan/right"
      cam1.panDown = "http://alp.byu.edu:8080/10.13.34.8/pan/down"
      cam1.stopPan = "http://alp.byu.edu:8080/10.13.34.8/pan/stop"

      const cam1p1 = new CameraPreset();
      cam1p1.displayName = "center"
      cam1p1.setPreset = "http://alp.byu.edu:8080/10.13.34.8/preset/1"

      const cam1p2 = new CameraPreset();
      cam1p2.displayName = "left"
      cam1p2.setPreset = "http://alp.byu.edu:8080/10.13.34.8/preset/2"

      const cam1p3 = new CameraPreset();
      cam1p3.displayName = "right"
      cam1p3.setPreset = "http://alp.byu.edu:8080/10.13.34.8/preset/3"

      cam1.presets = [];
      cam1.presets.push(cam1p1, cam1p2, cam1p3);

      const cam2 = new Camera();
      cam2.displayName = "back cam"
      cam2.panLeft = "http://alp.byu.edu:8080/10.13.34.8/pan/left"
      cam2.panUp = "http://alp.byu.edu:8080/10.13.34.8/pan/up"
      cam2.panRight = "http://alp.byu.edu:8080/10.13.34.8/pan/right"
      cam2.panDown = "http://alp.byu.edu:8080/10.13.34.8/pan/down"
      cam2.stopPan = "http://alp.byu.edu:8080/10.13.34.8/pan/stop"

      const cam2p1 = new CameraPreset();
      cam2p1.displayName = "center"
      cam2p1.setPreset = "http://alp.byu.edu:8080/10.13.34.8/preset/1"

      const cam2p2 = new CameraPreset();
      cam2p2.displayName = "left"
      cam2p2.setPreset = "http://alp.byu.edu:8080/10.13.34.8/preset/2"

      const cam2p3 = new CameraPreset();
      cam2p3.displayName = "right"
      cam2p3.setPreset = "http://alp.byu.edu:8080/10.13.34.8/preset/3"

      const cam2p4 = new CameraPreset();
      cam2p4.displayName = "center"
      cam2p4.setPreset = "http://alp.byu.edu:8080/10.13.34.8/preset/1"

      const cam2p5 = new CameraPreset();
      cam2p5.displayName = "left"
      cam2p5.setPreset = "http://alp.byu.edu:8080/10.13.34.8/preset/2"

      const cam2p6 = new CameraPreset();
      cam2p6.displayName = "right"
      cam2p6.setPreset = "http://alp.byu.edu:8080/10.13.34.8/preset/3"

      cam2.presets = [];
      cam2.presets.push(cam2p1, cam2p2, cam2p3, cam2p4, cam2p5, cam2p6);

      this.cameras.push(cam1, cam2);
    }

    console.log("cameras", this.cameras);
  }

  ngOnInit() {}
}
