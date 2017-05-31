import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable, Subject } from 'rxjs/Rx';

import 'rxjs/add/operator/map';

@Injectable()
export class APIService {
  public building: string;
  public room: string;
  public url: string;
  public loaded: Subject<boolean>;
  private hostname: string;
  private bool: boolean;

  private options: RequestOptions;
  private headers: Headers;

  constructor(private http: Http) { this.loaded = new Subject<boolean>(); }

  setup() {
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    this.options = new RequestOptions({ headers: this.headers });

    return this.getHostname().subscribe(data => {
      console.log("data = ", data);
      let split = JSON.stringify(data).split('-');
      let b = split[0].substring(1);

      this.building = b;
      this.room = split[1];

      this.url = "http://localhost:8000" + "/buildings/" + this.building + "/rooms/" + this.room;
      console.log("url =", this.url);

      console.log(this.loaded);
      this.loaded.next(true);
    });
  }

  getHostname(): Observable<Object> {
    return this.http.get("http://localhost:8888/hostname")
      .map(response => response.json());
  }

  getRoomConfig(): Observable<Object> {
    console.log("roomconfig url", this.url);
    return this.http.get(this.url + "/configuration")
      .map(response => response.json());
  }

  getRoomStatus(): Observable<Object> {
    console.log("roomstatus url", this.url);
    return this.http.get(this.url)
      .map(response => response.json());
  }

  putData(data: any): Observable<Object> {
    let body = JSON.stringify(data);
    console.log("putting:", data, "to", this.url, "with options", this.options);

    var val = this.http.put(this.url, data, this.options).map((res: Response) => res.json())
    val.subscribe();

    return val;
  }

  publish(event: any) {
    let body = JSON.stringify(event);
    console.log("publishing:", event);

    this.http.post("http://localhost:8888/publish", body, this.options).map((res: Response) => res.json()).subscribe();
  }

  handleError(error: Response | any) {
    let msg: string;
    msg = error.message ? error.message : error.toString();
    console.log(msg);

    return Observable.throw(msg);
  }
}
