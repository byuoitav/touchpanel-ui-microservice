import {Component, OnInit, Input, AfterViewInit, ViewChild} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {MatTabsModule} from '@angular/material/tabs';
import { map, Observable, tap} from 'rxjs';
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
  code: number;
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
        this.sendCamCommand(cam.tiltUp, this.code).subscribe({
      next: data => {
        console.log("Tilt Up response:", data);
      },
      error: err => {
        console.warn("Error:", err);
      },
      complete: () => {
        console.log("Tilt Up command complete.");
      }
    });
  }
  
  tiltDown = (cam: Camera) => {
    console.log("tilting down", cam.tiltDown);
    if (!cam.tiltDown) {
      return;
    }
      this.sendCamCommand(cam.tiltDown, this.code).subscribe({
      next: data => {
        console.log("Tilt Down response:", data);
      },
      error: err => {
        console.warn("Error:", err);
      },
      complete: () => {
        console.log("Tilt Down command complete.");
      }
    });
  }
  
  panLeft = (cam: Camera) => {
    console.log("panning left", cam.panLeft);
    if (!cam.panLeft) {
      return;
    }
      this.sendCamCommand(cam.panLeft, this.code).subscribe({
      next: data => {
        console.log("Pan Left response:", data);
      },
      error: err => {
        console.warn("Error:", err);
      },
      complete: () => {
        console.log("Pan Left command complete.");
      }
    });
  }
  
  panRight = (cam: Camera) => {
    console.log("panning right", cam.panRight);
    if (!cam.panRight) {
      return;
    }
      this.sendCamCommand(cam.panRight, this.code).subscribe({
      next: data => {
        console.log("Pan Right response:", data);
      },
      error: err => {
        console.warn("Error:", err);
      },
      complete: () => {
        console.log("Pan Right command complete.");
      }
    });
  }

  panTiltStop = (cam: Camera) => {
    console.log("stopping pan", cam.panTiltStop);
    if (!cam.panTiltStop) {
      return;
    }

    this.sendCamCommand(cam.panTiltStop, this.code).subscribe({
      next: data => {
        console.log("Pan Stop response:", data);
      },
      error: err => {
        console.warn("Error:", err);
      },
      complete: () => {
        console.log("Pan Stop command complete.");
      }
    });
  }
  
  zoomIn = (cam: Camera) => {
    console.log("zooming in", cam.zoomIn);
    if (!cam.zoomIn) {
      return;
    }
      this.sendCamCommand(cam.zoomIn, this.code).subscribe({
      next: data => {
        console.log("Zoom In response:", data);
      },
      error: err => {
        console.warn("Error:", err);
      },
      complete: () => {
        console.log("Zoom In command complete.");
      }
    });
  }
  
  zoomOut = (cam: Camera) => {
    console.log("zooming out", cam.zoomOut);
    if (!cam.zoomOut) {
      return;
    }
      this.sendCamCommand(cam.zoomOut, this.code).subscribe({
      next: data => {
        console.log("Zoom Out response:", data);
      },
      error: err => {
        console.warn("Error:", err);
      },
      complete: () => {
        console.log("Zoom Out command complete.");
      }
    });
  }
  
  zoomStop = (cam: Camera) => {
    console.log("stopping zoom", cam.zoomStop);
    if (!cam.zoomStop) {
      return;
    }
      this.sendCamCommand(cam.zoomStop, this.code).subscribe({
      next: data => {
        console.log("Zoom Stop response:", data);
      },
      error: err => {
        console.warn("Error:", err);
      },
      complete: () => {
        console.log("Zoom Stop command complete.");
      }
    });
  }
  
  selectPreset = (preset: CameraPreset) => {
    console.log("selecting preset", preset.displayName, preset.setPreset);
    if (!preset.setPreset) {
      return;
    }
      this.sendCamCommand(preset.setPreset, this.code).subscribe({
      next: data => {
        console.log("Select Preset response:", data);
      },
      error: err => {
        console.warn("Error:", err);
      },
      complete: () => {
        console.log("Select Preset command complete.");
      }
    });
  }
  

  getControlKey = () => {
    this.http.get(window.location.protocol + "//localhost:8000/control-key/" + this.room + "/" + this.preset.name)
    .pipe(
        tap(data => console.log("getControlKey response:", data))
      )
      .subscribe({
        next: data => {
          console.log("data", data);
          this.code = Number(data["ControlKey"]);
          document.cookie = `control-key=${this.code}; `;
        },
        error: err => {
          console.warn("err", err);
        },
        complete: () => {
          console.log("complete");
        }
      });
  }

  sendCamCommand(url: string, code: number): Observable<any> {
    const body = { url, code };
    return this.http.post(APIService.localurl + "/camera-control", body).pipe(
      tap(response => console.log("response from backend:", response)),
      map(response => response)
      );
  }
  
}
 