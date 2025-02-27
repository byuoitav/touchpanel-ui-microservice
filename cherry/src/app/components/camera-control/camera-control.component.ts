import {Component, OnInit, Input, AfterViewInit, ViewChild} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {MatTabsModule} from '@angular/material/tabs';
import { map, tap} from 'rxjs';
import {Camera, CameraPreset, Preset} from "../../objects/objects";
import { APIService } from '../../services/api.service';

@Component({
  selector: 'camera-control',
  templateUrl: './camera-control.component.html',
  styleUrls: ['./camera-control.component.scss']
})
export class CameraControlComponent implements OnInit, AfterViewInit {
  @Input() preset: Preset;

  @ViewChild(MatTabsModule)
  private _tabs: MatTabsModule;
  code: string;
  room = APIService.building + "-" + APIService.roomName;
  camLink = APIService.camLink;

  constructor(private http: HttpClient) {

  }

  ngOnInit() {
    console.log("cameras", this.preset.cameras);
    this.getControlKey();
    setInterval(() => {
      this.getControlKey();
    }, 120000)
  }

  ngAfterViewInit() {
  }

  tiltUp = (cam: Camera) => {
    console.log("tilting up", cam.tiltUp);
    if (!cam.tiltUp) {
      return;
    }

    this.http.get(cam.tiltUp).pipe(
      tap(data => console.log("tiltUp response:", data))
    ).subscribe({
      next: data => {
        console.log("data", data);
      },
      error: err => {
        console.warn("err", err);
      },
      complete: () => {
        console.log("complete");
      }
    });
  }

  tiltDown = (cam: Camera) => {
    console.log("tilting down", cam.tiltDown);
    if (!cam.tiltDown) {
      return;
    }

    this.http.get(cam.tiltDown).pipe(
      tap(data => console.log("tiltDown response:", data))
    ).subscribe({
      next: data => {
        console.log("data", data);
      },
      error: err => {
        console.warn("err", err);
      },
      complete: () => {
        console.log("complete");
      }
    });
  }

  panLeft = (cam: Camera) => {
    console.log("panning left", cam.panLeft);
    if (!cam.panLeft) {
      return;
    }

    this.http.get(cam.panLeft).pipe(
      tap(data => console.log("panLeft response:", data))
    ).subscribe({
      next: data => {
        console.log("data", data);
      },
      error: err => {
        console.warn("err", err);
      },
      complete: () => {
        console.log("complete");
      }
    });
  }

  panRight = (cam: Camera) => {
    console.log("panning right", cam.panRight);
    if (!cam.panRight) {
      return;
    }

    this.http.get(cam.panRight).pipe(
      tap(data => console.log("panRight response:", data))
    ).subscribe({
      next: data => {
        console.log("data", data);
      },
      error: err => {
        console.warn("err", err);
      },
      complete: () => {
        console.log("complete");
      }
    });
  }

  panTiltStop = (cam: Camera) => {
    console.log("stopping pan", cam.panTiltStop);
    if (!cam.panTiltStop) {
      return;
    }

    this.http.get(cam.panTiltStop).pipe(
      tap(data => console.log("panTiltStop response:", data))
    ).subscribe({
      next: data => {
        console.log("data", data);
      },
      error: err => {
        console.warn("err", err);
      },
      complete: () => {
        console.log("complete");
      }
    });
  }

  zoomIn = (cam: Camera) => {
    console.log("zooming in", cam.zoomIn);
    if (!cam.zoomIn) {
      return;
    }

    this.http.get(cam.zoomIn).pipe(
      tap(data => console.log("zoomIn response:", data))
    ).subscribe({
      next: data => {
        console.log("data", data);
      },
      error: err => {
        console.warn("err", err);
      },
      complete: () => {
        console.log("complete");
      }
    });
  }

  zoomOut = (cam: Camera) => {
    console.log("zooming out", cam.zoomOut);
    if (!cam.zoomOut) {
      return;
    }

    this.http.get(cam.zoomOut).pipe(
      tap(data => console.log("zoomOut response:", data))
    ).subscribe({
      next: data => {
        console.log("data", data);
      },
      error: err => {
        console.warn("err", err);
      },
      complete: () => {
        console.log("complete");
      }
    });
  }

  zoomStop = (cam: Camera) => {
    console.log("stopping zoom", cam.zoomStop);
    if (!cam.zoomStop) {
      return;
    }

    this.http.get(cam.zoomStop).pipe(
      tap(data => console.log("zoomStop response:", data))
    ).subscribe({
      next: data => {
        console.log("data", data);
      },
      error: err => {
        console.warn("err", err);
      },
      complete: () => {
        console.log("complete");
      }
    });
  }

  selectPreset = (preset: CameraPreset) => {
    console.log("selecting preset", preset.displayName, preset.setPreset);
    if (!preset.setPreset) {
      return;
    }

    this.http.get(preset.setPreset).pipe(
      tap(data => console.log("selectPreset response:", data))
    ).subscribe({
      next: data => {
        console.log("data", data);
      },
      error: err => {
        console.warn("err", err);
      },
      complete: () => {
        console.log("complete");
      }
    });
  }

  getControlKey = () => {
    this.http.get(window.location.protocol + "//" + window.location.host + "/control-key/" + this.room + "/" + this.preset.name)
      .pipe(
        tap(data => console.log("getControlKey response:", data))
      )
      .subscribe({
        next: data => {
          console.log("data", data);
          this.code = data["ControlKey"];
          document.cookie = `control-key=${this.code}; path=/;`;
        },
        error: err => {
          console.warn("err", err);
        },
        complete: () => {
          console.log("complete");
        }
      });
  }
}
 