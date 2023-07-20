import { Component, Input, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import { catchError, retry } from 'rxjs/operators';
import { Recording } from '../../objects/objects';

@Component({
  selector: 'recording',
  templateUrl: './recording.component.html',
  styleUrls: ['./recording.component.scss']
})
export class RecordingComponent implements OnInit {
  @Input() recording: Recording;

  isRecording: boolean = false;
  waiting: boolean = false;
  recordTime = 0;
  recordTimer: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (this.recording != undefined && this.recording.maxTime === undefined) {
      this.recording.maxTime = 120; // default maxTime to 120
    }
  }

  onClick() {
    if (this.isRecording) {
      this.stopRecording(this.recording);
    } else {
      this.startRecording(this.recording);
    }
  }

  startRecording = (rec: Recording) => {
    console.log("starting recording");
    if (!rec.start) {
      console.log("no url target to start recording");
      return false;
    }

    this.http.get(rec.start).pipe(
      retry(2),
      catchError(err => {
        throw "failed to start recording. " + err
      })
    ).subscribe(resp => {

      console.log("recording started");
      this.recordTime = 0;

      this.recordTimer = setInterval(() => {
        this.recordTime++;
        if (this.recordTime >= 60 * this.recording.maxTime) {
          this.stopRecording(this.recording);
        }
      }, 1000);

      this.isRecording = true;

    }, err => {
      console.log(err);
    });
  }

  stopRecording = (rec: Recording) => {
    console.log("stopping recording");
    if (!rec.stop) {
      console.log("no url target to stop recording");
      return false;
    }

    this.http.get(rec.stop).pipe(
      retry(2),
      catchError(err => {
        throw "failed to stop recording. " + err
      })
    ).subscribe(resp => {

      console.log("recording stopped");
      clearInterval(this.recordTimer);

      this.isRecording = false;

    }, err => {
      console.log(err);
    });
  }

}
