import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { of } from "rxjs";
import {
  UIConfiguration,
  Room,
  RoomConfiguration,
  RoomStatus
} from "../objects/objects";
import { Event } from "./socket.service";

import {tap, catchError, map, timeout} from 'rxjs/operators';
import { deserialize } from "serializer.ts/Serializer";
import { JsonConvert } from "json2typescript";

const RETRY_TIMEOUT = 5 * 1000;
const MONITOR_TIMEOUT = 30 * 1000;

@Injectable()
export class APIService {
  public static building: string;
  public static roomName: string;
  public static piHostname: string;
  public static hostname: string;
  public static apiurl: string;

  public static room: Room;
  public static helpConfig: any;

  public static apihost: string;
  private static localurl: string;
  private static options: {};

  public loaded: EventEmitter<boolean>;
  public jsonConvert: JsonConvert;

  constructor(private http: HttpClient) {
    this.loaded = new EventEmitter<boolean>();
    this.jsonConvert = new JsonConvert();
    this.jsonConvert.ignorePrimitiveChecks = false;

    if (APIService.options == null) {
      const headers = new Headers();
      headers.append("content-type", "application/json");
      APIService.options = { headers: headers };
      const base = location.origin.split(":");
      APIService.localurl = base[0] + ":" + base[1];

      APIService.room = new Room();

      this.setupHostname();
    } else {
      this.loaded.emit(true);
    }
  }

  private setupHostname() {
    this.getHostname().pipe(
      tap(data => console.log("got hostname", data)),
      catchError(this.handleError('setupHostname', [])),
      map(response => response)
    ).subscribe({
      next: data => {
        APIService.hostname = String(data);
        this.setupPiHostname();
      },
      error: err => {
        setTimeout(() => this.setupHostname(), RETRY_TIMEOUT);
      },
      complete: () => console.log('done')
    });
  }
  

  // hostname, building, room
  private setupPiHostname() {
    this.getPiHostname().pipe(
      tap(data => console.log("got pi hostname", data)),
      catchError(this.handleError('setupPiHostname', [])),
      map(response => response)
    ).subscribe({
      next: data => {
        APIService.piHostname = String(data);

        const split = APIService.piHostname.split("-");
        APIService.building = split[0];
        APIService.roomName = split[1];

        this.setupAPIUrl(false);
      },
      error: err => {
        setTimeout(() => this.setupPiHostname(), RETRY_TIMEOUT);
        console.error("error getting pi hostname", err);
      },
      complete: () => console.log('done')
    });
  }

  private setupAPIUrl(next: boolean) {
    if (next){
      console.warn("switching to next api");
      this.getNextAPIUrl().pipe(
        tap(data => console.log("got next api url", data)),
        catchError(this.handleError('setupAPIUrl', [])),  
      ).subscribe({
        next: data => {},
        error: err => {
          setTimeout(() => this.setupAPIUrl(next), RETRY_TIMEOUT);
          console.error("error getting next api url", err);
        },
        complete: () => console.log('done')
      });
    }

    this.getAPIUrl().pipe(
      tap(data => console.log("got api url", data)),
      catchError(this.handleError('setupAPIUrl', [])),
    ).subscribe({
      next: data => {
        APIService.apihost = "http://" + location.hostname;
        if (!data["hostname"].includes("localhost")) {
          APIService.apihost = "http://" + data["hostname"];
        }

        APIService.apiurl = APIService.apihost + ":8000/buildings/" + APIService.building + "/rooms/" + APIService.roomName;
        console.info("API url:", APIService.apiurl);

        if (!next) {
          this.setupUIConfig();
        }
      },
      error: err => {
        setTimeout(() => this.setupAPIUrl(next), RETRY_TIMEOUT);
        console.error("error getting api url", err);
      },
      complete: () => console.log('done')
    });
  }

  private monitorAPI() {
    this.getAPIHealth().pipe(
      tap(data => console.log("got api health", data)),
      catchError(this.handleError('monitorAPI', [])),
    ).subscribe({
      next: data => {
        if (data["statuscode"] !== 0) {
          this.setupAPIUrl(true);
        }

        setTimeout(() => this.monitorAPI(), MONITOR_TIMEOUT);
      },
      error: err => {
        this.setupAPIUrl(true);
        setTimeout(() => this.monitorAPI(), MONITOR_TIMEOUT);
      },
      complete: () => console.log('done')
    });
  }

  private setupUIConfig() {
    this.getUIConfig().pipe(
      tap(data => console.log("got ui config", data)),
      catchError(this.handleError('setupUIConfig', [])),
    ).subscribe({
      next: data => {
        APIService.room.uiconfig = new UIConfiguration();
        Object.assign(APIService.room.uiconfig, data);
        console.info("UI Configuration:", APIService.room.uiconfig);

        this.setupHelpConfig();
      },
      error: err => {
        setTimeout(() => this.setupUIConfig(), RETRY_TIMEOUT);
      },
      complete: () => console.log('done')
    });
  }

  private setupHelpConfig() {
    this.getHelpConfig().pipe(
      tap(data => console.log("got help config", data)),
      catchError(this.handleError('setupHelpConfig', [])),
    ).subscribe({
      next: data => {
        APIService.helpConfig = new Object();
        Object.assign(APIService.helpConfig, data);
        console.info("help config", APIService.helpConfig);

        this.setupRoomConfig();
      },
      error: err => {
        setTimeout(() => this.setupHelpConfig(), RETRY_TIMEOUT);
      },
      complete: () => console.log('done')
    });
  }

  private setupRoomConfig() {
    this.getRoomConfig().pipe(
      tap(data => console.log("got room config", data)),
      catchError(this.handleError('setupRoomConfig', [])),
    ).subscribe({
      next: data => {
        APIService.room.config = new RoomConfiguration();
        Object.assign(APIService.room.config, data);

        console.info("Room Configuration:", APIService.room.config);

        this.setupRoomStatus();
      },
      error: err => {
        setTimeout(() => this.setupRoomConfig(), RETRY_TIMEOUT);
      },
      complete: () => console.log('done')
    });
  }

  private setupRoomStatus() {
    this.getRoomStatus().pipe(
      tap(data => console.log("got room status", data)),
      catchError(this.handleError('setupRoomStatus', [])),
    ).subscribe({
      next: data => {
        APIService.room.status = new RoomStatus();
        Object.assign(APIService.room.status, data);
        console.info("Room Status:", APIService.room.status);

        this.loaded.emit(true);
      },
      error: err => {
        setTimeout(() => this.setupRoomStatus(), RETRY_TIMEOUT);
      },
      complete: () => console.log('done')
    });
  }

  get(
    url: string,
    success: Function = func => {},
    err: Function = func => {},
    after: Function = func => {}
  ): void {

    this.http.get(url).pipe(
      tap(data => console.log("got data", data)),
      catchError(this.handleError('get', []))
    );

  }

  private getHostname(): Observable<Object> {
    return this.http.get(APIService.localurl + ":8888/hostname").pipe(
      tap(data => console.log("got hostname", data)),
      catchError(this.handleError('getHostname', []))
    );

  }

  private getPiHostname(): Observable<Object> {
    return this.http.get(APIService.localurl + ":8888/pihostname").pipe(
      tap(data => console.log("got pi hostname", data)),
      catchError(this.handleError('getPiHostname', []))
    );
  }

  private getAPIUrl(): Observable<Object> {
    return this.http.get(APIService.localurl + ":8888./api").pipe(
      tap(data => console.log("got api url", data)),
      catchError(this.handleError('getAPIUrl', []))
    );
  }

  private getAPIHealth(): Observable<Object> {
    return this.http.get(APIService.apihost + ":8000/mstatus").pipe(
      timeout(RETRY_TIMEOUT),
      tap(data => console.log("got api health", data)),
      catchError(this.handleError('getAPIHealth', []))
    );
  }

  private getNextAPIUrl(): Observable<Object> {
    return this.http.get(APIService.localurl + ":8888/nextapi").pipe(
      tap(data => console.log("got next api url", data)),
      catchError(this.handleError('getNextAPIUrl', []))
    );
  }

  private getUIConfig(): Observable<Object> {
    return this.http.get(APIService.localurl + ":8888/uiconfig").pipe(
      tap(data => console.log("got ui config", data)),
      map(res => deserialize<UIConfiguration>(UIConfiguration, res)),
      map(res => UIConfiguration),
      catchError(this.handleError('getUIConfig', []))
    );
  }

  private getHelpConfig(): Observable<Object> {
    return this.http.get(APIService.localurl + ":8888/blueberry/db/help.json").pipe(
      tap(data => console.log("got help config", data)),
      catchError(this.handleError('getHelpConfig', []))
    );
  }

  private getRoomConfig(): Observable<Object> {
    return this.http.get(APIService.apiurl + "/configuration").pipe(
      tap(data => console.log("got room config", data)),
      map(res => deserialize<RoomConfiguration>(RoomConfiguration, res)),
      catchError(this.handleError('getRoomConfig', []))
    );
  }

  private getRoomStatus(): Observable<Object> {
    return this.http.get(APIService.apiurl).pipe(
      tap(data => console.log("got room status", data)),
      map(res => deserialize<RoomStatus>(RoomStatus, res)),
      catchError(this.handleError('getRoomStatus', []))
    );
  }

  public sendEvent(event: Event) {
    const data = this.jsonConvert.serializeObject(event);
    console.log("sending event", data);
 
    this.http.post(APIService.localurl + ":8888/publish", data, APIService.options).pipe(
      tap(data => console.log("sent event", data)),
      catchError(this.handleError('sendEvent', [])),
    );
  }

  public help(type: string): Observable<Object> {
    const body = { building: APIService.building, room: APIService.roomName };

    switch (type) {
      case "help":

        return this.http.post(APIService.localurl + ":8888/help", body, APIService.options).pipe(
          tap(data => console.log("sent help", data)),
          catchError(this.handleError('help', [])),
        );
      case "confirm":
       
        return this.http.post(APIService.localurl + ":8888/confirmhelp", body, APIService.options).pipe(
          tap(data => console.log("sent confirm help", data)),
          catchError(this.handleError('help', [])),
        );
      case "cancel":
        return this.http.post(APIService.localurl + ":8888/cancelhelp", body, APIService.options).pipe(
          tap(data => console.log("sent cancel help", data)),
          catchError(this.handleError('help', [])),
        );

    }
  }

  private handleError<T>(operation: string, result?: T) {
    return (error: any): Observable<T> => {
      console.error("error doing %s err: $s", operation, error);
      return of(result as T);
    };
  }
}
