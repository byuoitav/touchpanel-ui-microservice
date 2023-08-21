import {Injectable, EventEmitter} from "@angular/core";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Observable, of, timeout} from "rxjs";
import {
  UIConfiguration,
  Room,
  RoomConfiguration,
  RoomStatus
} from "../objects/objects";
import {Event} from "./socket.service";
import {JsonConvert} from "json2typescript";

import {deserialize} from "serializer.ts/Serializer";
import { tap } from "rxjs";
import { catchError } from "rxjs";
import { map } from "rxjs";
import { subscribe } from "diagnostics_channel";

const RETRY_TIMEOUT = 5 * 1000;
const MONITOR_TIMEOUT = 30 * 1000;

@Injectable()
export class APIService {
  public loaded: EventEmitter<boolean>;
  private jsonConvert: JsonConvert;

  public static building: string;
  public static roomName: string;
  public static piHostname: string;
  public static hostname: string;
  public static apiurl: string;

  public static room: Room;

  public static apihost: string;
  private static localurl: string;
  private static options: {};

  constructor(private http: HttpClient) {
    this.loaded = new EventEmitter<boolean>();
    this.jsonConvert = new JsonConvert();
    this.jsonConvert.ignorePrimitiveChecks = false;

    if (APIService.options == null) {
      const headers = new Headers();
      headers.append("content-type", "application/json");
      APIService.options = {headers: new HttpHeaders(headers)};
      APIService.localurl = window.location.protocol + "//" + window.location.host;

      APIService.room = new Room();

      this.setupHostname();
    } else {
      this.loaded.emit(true);
    }
  }

  private setupHostname() {

    this.getHostname().pipe(
      tap(data => console.log("getHostname response", data)),
      catchError(this.handleError("get", [])),
      map(response => response),
    ).subscribe({
      next: data => {
        APIService.hostname = String(data);
        this.setupPiHostname();
      },
      error: err => {
        setTimeout(() => this.setupHostname(), RETRY_TIMEOUT);
        console.error("getHostname error", err);
      },
      complete: () => {
        console.log("getHostname complete");
      }
    });
  }

  // hostname, building, room
  private setupPiHostname() {
    this.getPiHostname().pipe(
      tap(data => console.log("getPiHostname response", data)),
      catchError(this.handleError("get", [])),
      map(response => response),
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
        console.error("getPiHostname error", err);
      },
      complete: () => {
        console.log("getPiHostname complete");
      }
    });
  }

  private setupAPIUrl(next: boolean) {
    if (next) {
      console.warn("switching to next api");
      this.getNextAPIUrl().pipe( 
        tap(data => console.log("getNextAPIUrl response", data)),
        catchError(this.handleError("get", [])),
      ).subscribe({
        next: data => {},
        error: err => {
          setTimeout(() => this.setupAPIUrl(next), RETRY_TIMEOUT);
          console.error("getNextAPIUrl error", err);
        },
        complete: () => {
          console.log("getNextAPIUrl complete");
        }
      });
    }

    this.getAPIUrl().pipe(
      tap(data => console.log("getAPIUrl response", data)),
      catchError(this.handleError("get", [])),
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
        console.error("getAPIUrl error", err);
      },
      complete: () => {
        console.log("getAPIUrl complete");
      }
    });
  }

  private monitorAPI() {

    this.getAPIHealth().pipe(
      tap(data => console.log("getAPIHealth response", data)),
      catchError(this.handleError("get", [])),
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
      complete: () => {
        console.log("getAPIHealth complete");
      }
    });
  }

  private setupUIConfig() {

    this.getUIConfig().pipe(
      tap(data => console.log("getUIConfig response", data)),
      catchError(this.handleError("get", [])),
    ).subscribe({
      next: data => {
        console.info("ui-config:", data);
        APIService.room.uiconfig = new UIConfiguration();
        Object.assign(APIService.room.uiconfig, data);
        console.info("UI Configuration:", APIService.room.uiconfig);

        this.setupRoomConfig();
      },
      error: err => {
        setTimeout(() => this.setupUIConfig(), RETRY_TIMEOUT);
        console.error("getUIConfig error", err);
      },
      complete: () => {
        console.log("getUIConfig complete");
      }
    });
  }

  private setupRoomConfig() {

    this.getRoomConfig().pipe(
      tap(data => console.log("getRoomConfig response", data)),
      catchError(this.handleError("get", [])),
    ).subscribe({
      next: data => {
        APIService.room.config = new RoomConfiguration();
        Object.assign(APIService.room.config, data);

        console.info("Room Configuration:", APIService.room.config);

        this.setupRoomStatus();
      },
      error: err => {
        setTimeout(() => this.setupRoomConfig(), RETRY_TIMEOUT);
        console.error("getRoomConfig error", err);
      },
      complete: () => {
        console.log("getRoomConfig complete");
      }
    });
  }

  private setupRoomStatus() {

    this.getRoomStatus().pipe(
      tap(data => console.log("getRoomStatus response", data)),
      catchError(this.handleError("get", [])),
    ).subscribe({
      next: data => {
        APIService.room.status = new RoomStatus();
        Object.assign(APIService.room.status, data);
        console.info("Room Status:", APIService.room.status);

        this.loaded.emit(true);
      },
      error: err => {
        setTimeout(() => this.setupRoomStatus(), RETRY_TIMEOUT);
        console.error("getRoomStatus error", err);
      },
      complete: () => {
        console.log("getRoomStatus complete");
      }
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
      catchError(this.handleError("get", [])),
      map(response => response),
    ).subscribe({
      next: data => { success(); },
      error: error => {
        console.error("error:", error);
        err();
      },
      complete: () => { after(); }
    });

  }

  private getHostname(): Observable<Object> {
    return this.http.get(APIService.localurl + "/hostname").pipe(
      tap(data => console.log("got hostname", data)),
      catchError(this.handleError("getHostname", [])),
      map(response => response)
    );
  }

  private getPiHostname(): Observable<Object> {
    return this.http.get(APIService.localurl + "/pihostname").pipe(
      tap(data => console.log("got pihostname", data)),
      catchError(this.handleError("getPiHostname", [])),
      map(response => response)
    );
  }

  private getAPIUrl(): Observable<Object> {
    return this.http.get(APIService.localurl + "/api").pipe(
      tap(data => console.log("got apiurl", data)),
      catchError(this.handleError("getAPIUrl", [])),
      map(response => response)
    );
  }

  private getAPIHealth(): Observable<Object> {
    return this.http.get(APIService.apihost + ":8000/mstatus").pipe(
      tap(data => console.log("got api health", data)),
      catchError(this.handleError("getAPIHealth", [])),
      map(response => response),
      timeout(RETRY_TIMEOUT),
    );
  }

  private getNextAPIUrl(): Observable<Object> {
    return this.http.get(APIService.localurl + "/nextapi").pipe(
      tap(data => console.log("got nextapi", data)),
      catchError(this.handleError("getNextAPIUrl", [])),
      map(response => response)
    );
  }

  private getUIConfig(): Observable<Object> {
    return this.http.get(APIService.apiurl + "/uiconfig").pipe(
      tap(data => console.log("got uiconfig", data)),
      catchError(this.handleError("getUIConfig", [])),
      map(response => response),
      map(res => deserialize<UIConfiguration>(UIConfiguration, res))
    );
  }
  
  private getRoomConfig(): Observable<Object> {
    return this.http.get(APIService.apiurl + "/configuration").pipe(
      tap(data => console.log("got roomconfig", data)),
      catchError(this.handleError("getRoomConfig", [])),
      map(response => response),
      map(res => deserialize<RoomConfiguration>(RoomConfiguration, res))
    );
  }

  private getRoomStatus(): Observable<Object> {
    return this.http.get(APIService.apiurl).pipe(
      tap(data => console.log("got roomstatus", data)),
      catchError(this.handleError("getRoomStatus", [])),
      map(response => response),
      map(res => deserialize<RoomStatus>(RoomStatus, res))
    );
  }

  public sendEvent(event: Event) {
    const data = this.jsonConvert.serializeObject(event);
    console.log("sending event", data);

    this.http
      .post(APIService.localurl + "/publish", data, APIService.options)
      .subscribe();
  }

  public help(type: string): Observable<Object> {
    const body = {building: APIService.building, room: APIService.roomName};

    switch (type) {
      case "help":
        return this.http.post(APIService.localurl + "/help ", body, APIService.options).pipe(
          tap(data => console.log("sent help", data)),
          catchError(this.handleError('help', []))
        );
        
      case "confirm":
        return this.http.post(
          APIService.localurl + "/confirmhelp",
          body,
          APIService.options
        );
      case "cancel":
        return this.http.post(
          APIService.localurl + "/cancelhelp",
          body,
          APIService.options
        );
    }
  }

  private handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      console.error("error doing ${operation}:", error);
      return of(result as T);
    };
  }

}
