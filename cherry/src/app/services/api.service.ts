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
import { response } from "express";

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

  constructor(private http: HttpClient, private couchDBService: CouchDBService) {
    this.loaded = new EventEmitter<boolean>();
    this.jsonConvert = new JsonConvert();
    this.jsonConvert.ignorePrimitiveChecks = false;

    if (APIService.options == null) {
      const headers = new Headers();
      headers.append("content-type", "application/json");
      APIService.options = {headers: headers, responseType: "text" as "json"};
      APIService.localurl = window.location.protocol + "//" + window.location.host;

      APIService.room = new Room();
      couchDBService.fetchCouchDB();
      this.setupHostname();
    } else {
      this.loaded.emit(true);
    }
  }

  //use the new subscribe syntax
  private setupHostname() {
    this.getHostname().subscribe({
      next: data => {
        APIService.hostname = String(data);
        console.log("got hostname", APIService.hostname);
        this.setupPiHostname();
      },
      error: err => {
        setTimeout(() => this.setupHostname(), RETRY_TIMEOUT);
        console.error("Observer getHostname got an error: " + err);
      },
      complete: () => {
        console.log("Observer getHostname got a complete notification");
      }
    });
  }

  // hostname, building, room
  private setupPiHostname() {
    this.getPiHostname().subscribe({
      next: data => {
        APIService.piHostname = String(data);
        console.log("got pihostname", APIService.piHostname);

        const split = APIService.piHostname.split("-");
        APIService.building = split[0];
        APIService.roomName = split[1];
        console.log("building:", APIService.building, "room:", APIService.roomName);

        this.setupAPIUrl(false);
      },
      error: err => {
        setTimeout(() => this.setupPiHostname(), RETRY_TIMEOUT);
        console.error("Observer getPiHostname got an error: " + err);
      },
      complete: () => {
        console.log("Observer getPiHostname got a complete notification");
      }
    });
  }

  private setupAPIUrl(next: boolean) {
    if (next) {
      console.warn("switching to next api");
      this.getNextAPIUrl().subscribe({
        next: data => {},
        error: err => {
          setTimeout(() => this.setupAPIUrl(next), RETRY_TIMEOUT);
          console.error("Observer getNextAPIUrl got an error: " + err);
        },
        complete: () => {
          console.log("Observer getNextAPIUrl got a complete notification");
        }
      });
    }

    this.getAPIUrl().subscribe({
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
        console.error("Observer getAPIUrl got an error: " + err);
      },
      complete: () => {
        console.log("Observer getAPIUrl got a complete notification");
      }
    });
  }

  private monitorAPI() {
    this.getAPIHealth().subscribe({
      next: data => {
        if (data["statuscode"] !== 0) {
          this.setupAPIUrl(true);
        }

        setTimeout(() => this.monitorAPI(), MONITOR_TIMEOUT);
      },
      error: err => {
        console.error("Observer getAPIHealth got an error: " + err);
        this.setupAPIUrl(true);
        setTimeout(() => this.monitorAPI(), MONITOR_TIMEOUT);
      },
      complete: () => {
        console.log("Observer getAPIHealth got a complete notification");
      }
    });
  }

  private setupUIConfig() {
    this.getUIConfig().subscribe({
      next: data => {
        console.info("ui-config:", data);
        APIService.room.uiconfig = new UIConfiguration();
        Object.assign(APIService.room.uiconfig, data);
        console.info("UI Configuration:", APIService.room.uiconfig);

        this.setupRoomConfig();;
      },
      error: err => {
        setTimeout(() => this.setupUIConfig(), RETRY_TIMEOUT);
        console.error("Observer getUIConfig got an error: " + err);
      },
      complete: () => {
        console.log("Observer getUIConfig got a complete notification");
      }
    });
  }

  private setupRoomConfig() {
    this.getRoomConfig().subscribe({
      next: data => {
        APIService.room.config = new RoomConfiguration();
        Object.assign(APIService.room.config, data);

        console.info("Room Configuration:", APIService.room.config);

        this.setupRoomStatus();
      },
      error: err => {
        setTimeout(() => this.setupRoomConfig(), RETRY_TIMEOUT);
        console.error("Observer getRoomConfig got an error: " + err);
      },
      complete: () => {
        console.log("Observer getRoomConfig got a complete notification");
      }
    });
  }

  private setupRoomStatus() {
    this.getRoomStatus().subscribe({
      next: data => {
        APIService.room.status = new RoomStatus();
        Object.assign(APIService.room.status, data);
        console.info("Room Status:", APIService.room.status);

        this.loaded.emit(true);
      },
      error: err => {
        setTimeout(() => this.setupRoomStatus(), RETRY_TIMEOUT);
        console.error("Observer getRoomStatus got an error: " + err);
      },
      complete: () => {
        console.log("Observer getRoomStatus got a complete notification");
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
      map(response => response),
      catchError(this.handleError("get", [])),
    ).subscribe({
      next: data => success(data),
      error: error => {err("error:", error), err()},
      complete: () => after()
    });

  }

  private getHostname(): Observable<Object> {
    return this.http.get(APIService.localurl + "/hostname").pipe(
      tap(data => console.log("got hostname", data)),
      catchError(this.handleError("getHostname", [])),
      map(data => data)
    );
  }

  private getPiHostname(): Observable<Object> {
    return this.http.get(APIService.localurl + "/pihostname").pipe(
      tap(data => console.log("got pihostname", data)),
      catchError(this.handleError("getPiHostname", [])),
      map(data => data)
    );
  }

  private getAPIUrl(): Observable<Object> {
    return this.http.get(APIService.localurl + "/api").pipe(
      tap(data => console.log("got apiurl", data)),
      catchError(this.handleError("getAPIUrl", [])),
      map(data => data)
    );
  }

  private getAPIHealth(): Observable<Object> {
    return this.http.get(APIService.apihost + ":8000/mstatus").pipe(
      tap(data => console.log("got api health", data)),
      catchError(this.handleError("getAPIHealth", [])),
      map(data => data),
      timeout(RETRY_TIMEOUT),
    );
  }

  private getNextAPIUrl(): Observable<Object> {
    return this.http.get(APIService.localurl + "/nextapi").pipe(
      tap(data => console.log("got nextapi", data)),
      catchError(this.handleError("getNextAPIUrl", [])),
      map(data => data)
    );
  }

  private getUIConfig(): Observable<Object> {
    return this.http.get(APIService.localurl + "/uiconfig").pipe(
      tap(data => console.log("got uiconfig", data)),
      catchError(this.handleError("getUIConfig", [])),
      map(data => data),
      map(data => deserialize<UIConfiguration>(UIConfiguration, data))
    );
  }
  
  private getRoomConfig(): Observable<Object> {
    return this.http.get(APIService.apiurl + "/configuration").pipe(
      tap(data => console.log("got roomconfig", data)),
      catchError(this.handleError("getRoomConfig", [])),
      map(data => data),
      map(data => deserialize<RoomConfiguration>(RoomConfiguration, data))
    );
  }

  private getRoomStatus(): Observable<Object> {
    return this.http.get(APIService.apiurl).pipe(
      tap(data => console.log("got roomstatus", data)),
      catchError(this.handleError("getRoomStatus", [])),
      map(data => data),
      map(data => deserialize<RoomStatus>(RoomStatus, data))
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

  private handleError<T>(operation: string, result?: T) {
    return (error: any): Observable<T> => {
      console.error("error doing:", operation, "err:", error)
      return of(result as T);
    };
  }

}

@Injectable()
export class CouchDBService {
  private couchDbUrl = 'http://localhost:5984/css';

  constructor(private http: HttpClient) {}

  getLogo(): Observable<string> {
    const headers = new HttpHeaders({
      'Authorization': 'Basic ' + btoa('admin:admin'),
      'Content-Type': 'application/json'
    });
  
    return this.http.get(`${this.couchDbUrl}/Ensign_College_wordmark.svg/logo.svg`, {
      headers: headers,
      responseType: 'text' 
    })
  }
  

  //gets the CSS colors from the CouchDB database
  fetchCouchDB = async () => {
    try {
      const response = await fetch(this.couchDbUrl + '/activeConfig', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add your credentials here
          'Authorization': 'Basic ' + btoa('admin:admin')
        },
        credentials: 'include', // include cookies
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      document.documentElement.style.setProperty('--background-color', data['background-color']);
      document.documentElement.style.setProperty('--top-bar-color', data['top-bar-color']);
      document.documentElement.style.setProperty('--background-color-accent', data['background-color-accent']);
      document.documentElement.style.setProperty('--dpad-color', data['dpad-color']);
      document.documentElement.style.setProperty('--dpad-press', data['dpad-press']);
      document.documentElement.style.setProperty('--cam-preset-color', data['cam-preset-color']);
      document.documentElement.style.setProperty('--volume-slider-color', data['volume-slider-color']);
      document.documentElement.style.setProperty('--help-button-color', data['help-button-color']);
      document.documentElement.style.setProperty('--text-color', data['text-color']);
      document.documentElement.style.setProperty('--font-name', data['font-name']);

      //import the font
      const fontUrl = data['font-link'];
      console.log("Font URL: ", fontUrl);
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = fontUrl;
      // Wait for the font to load
      linkElement.onload = () => {
        document.body.style.setProperty('font-family', data['font-name'] + ', sans-serif');
      };

      document.head.appendChild(linkElement);

      console.log(data);
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error.message);
    }
  };
}