import { Component, Input, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Recording } from '../../objects/objects';

@Component({
  selector: 'recording',
  templateUrl: './recording.component.html',
  styleUrls: ['./recording.component.scss']
})
export class RecordingComponent implements OnInit {
  @Input() recording: Recording;

  status: boolean = false;
  recordTime = 0;
  recordTimer: any;
  

  constructor(private http: Http) { }

  ngOnInit() {
  }

  onClick() {
    if (this.status) {
      this.stopRecording(this.recording);
      clearInterval(this.recordTimer);
    } else {
      this.startRecording(this.recording);
      this.recordTime = 0;
      this.recordTimer = setInterval(() => {
        this.recordTime++;
      }, 1000);
    }
    this.status = !this.status;
  }

  startRecording = (rec: Recording) => {
    console.log("starting recording");
    if (!rec.start) {
      console.log("none");
      return false;
    }

    this.http.get(rec.start).subscribe(resp => {
      console.log("recording started");
      return true;
    }, err => {
      console.log("couldn't start recording", err);
      return false;
    });
  }

  stopRecording = (rec: Recording) => {
    console.log("stopping recording");
    if (!rec.stop) {
      console.log("none");
      return false;
    }

    this.http.get(rec.stop).subscribe(resp => {
      console.log("recording stopped");
      return true;
    }, err => {
      console.log("couldn't stop recording", err);
      return false;
    });
  }

}
