import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { DeviceConfiguration } from "../objects/objects";
import { APIService } from "./api.service";
import { DataService } from "./data.service";
import { SocketService, MESSAGE, Event } from "./socket.service";
import { map, tap, Observable, of, catchError } from "rxjs"
import * as e from "express";

/*
 *
 *  When the GraphService recieves an event from a Pi that is monitoring contact points,
 *      it will find the node who's display field matches the full set of displays on one half
 *      of the eventInfoValue (shown below). Once it finds that node (1), it will create a new node (2) with
 *      displays equal to the other half of the eventInfoValue as a child of the node (1).
 *
 *  The HomeComponent will use the GraphService to decide which names to show when a user presses share.
 *
 *  An example event from the contact-point monitioring pi is:
 *  {
 *      eventInfoKey:   'OPENED',
 *      eventInfoValue: 'D4,D5,D6/D7,D8,D9'
 *  }
 */

const CONNECT = "connect";
const DISCONNECT = "disconnect";
const LEFT_RIGHT_DELIMITER = "/";
const DISPLAY_DELIMITER = ",";

@Injectable()
export class GraphService {
  public displayList: EventEmitter<Set<string>>;

  private root: Node;
  private exists = false;
  private nodes: Node[] = [];

  private dividerSensor: DeviceConfiguration;

  constructor(
    private data: DataService,
    private socket: SocketService,
    private http: HttpClient
  ) {
    this.displayList = new EventEmitter<Set<string>>();

    this.data.loaded.subscribe(() => {
      this.init();
    });
  }

  public init() {
    if (this.exists) {
      return;
    }

    if (this.data.panel.preset.shareableDisplays == null) {
      return;
    }

    // the root node is the set of displays and shareableDisplays for the preset
    const displays: Set<string> = new Set();
    this.data.panel.preset.displays.forEach(d => displays.add(d.name));
    this.data.panel.preset.shareableDisplays.forEach(d => displays.add(d));

    this.root = new Node(displays);
    this.nodes.push(this.root);
    this.exists = true;

    // get the current connected/disconnected state
    this.dividerSensor = APIService.room.config.devices.find(d =>
      d.hasRole("DividerSensor")
    );

    console.log("dividerSensor", this.dividerSensor);
    if (this.dividerSensor != null) {
      /* cherry doesn't need to do this? it doesn't do sharing
      this.getDividerSensorStatus();
      this.update();

      // set the current preset if necessary
      if (this.data.panel.features.includes(PRESET_SWITCH)) {
        this.setCurrentPreset();
      }

      console.log("root", this.root);
      */
    } else {
      console.warn(
        "no divider sensor found. not listening for division events."
      );
    }
  }

  public getDisplayList(): Set<string> {
    const ret: Set<string> = new Set();

    this.getdisplaylist(this.root, ret);
    return ret;
  }

  /*
   * recursivly descends through nodes and adds their displays to the list
   */
  private getdisplaylist(node: Node, list: Set<string>): Set<string> {
    let displays = Array.from(node.displays);

    displays = displays.filter(d => !list.has(d));

    if (displays.length > 0) {
      displays.forEach(d => list.add(d));

      for (const child of node.children) {
        this.getdisplaylist(child, list);
      }
    }

    return list;
  }

  /*
   * gets the status of the room from the divider sensor.
   * loops through the connected events and adds connected nodes until
   * there isnt' a change in my displays.
   *
   * loops through the disconnected events and disconnects displays that may be disconnected.
   *      TODO (?) is this necessary? or should i just assume they are disconnected.
   */
  private getDividerSensorStatus() {
    if (this.dividerSensor != null) {
      
      this.http.get("http://" + this.dividerSensor.address + ":10000/divider/state").pipe(
        map(res => res),  
        tap(res => console.log("getDividerSensorStatus", res)),
        catchError(this.handleError("getDividerSensorStatus", []))
      ).subscribe({
        next: data => {
          if (data["connected"] != null) {
            let numChanged: number;
            do {
              numChanged = 0;

              for (const connected of data["connected"]) {
                if (this.connect(connected)) {
                  ++numChanged;
                }
              }
            } while (numChanged > 0);
          }

          if (data["disconnected"] != null) {
            for (const disconnected of data["disconnected"]) {
              this.disconnect(disconnected);
            }
          }
        },
        error: err => {
          setTimeout(this.getDividerSensorStatus, 5000);
          console.warn("failed to get divider sensor status, trying again in 5 seconds", err);
        },
        complete: () => {
          console.log("completed getting divider sensor status");
        }

      });
    }
  }

  private setCurrentPreset() {

    this.http.get("http://" + this.dividerSensor.address + ":10000/divider/preset/" + APIService.piHostname).pipe(
      map(res => res),
      tap(res => console.log("setCurrentPreset", res)),
      catchError(this.handleError("setCurrentPreset", []))
    ).subscribe({
      next: data => {
        const preset = this.data.presets.find(
          p => p.name.toLowerCase() === data.toString().toLowerCase()
          );

        if (preset != null) {
          console.log("setting initial preset to", preset);
          this.data.panel.preset = preset;
        } else {
          console.error("current preset response doesn't exist. response: ", data);
        }
      },
      error: err => {
        console.warn("failed to get intial preset from divider sensor, trying again...", err);
        setTimeout(this.setCurrentPreset, 5000);
      },
      complete: () => {
        console.log("completed setting current preset");
      }
    });
  }

  private getNodeByDisplays(list: Set<string>): Node {
    const l = JSON.stringify(Array.from(list));
    return this.nodes.find(n => JSON.stringify(Array.from(n.displays)) === l);
  }

  private connect(s: string): boolean {
    console.info("*connected* event:", s);
    const sides = s.split(LEFT_RIGHT_DELIMITER);
    const left = new Set(sides[0].split(DISPLAY_DELIMITER));
    const right = new Set(sides[1].split(DISPLAY_DELIMITER));

    let changed = false;

    let lnode = this.getNodeByDisplays(left);
    let rnode = this.getNodeByDisplays(right);

    if (lnode == null) {
      lnode = new Node(left);
      this.nodes.push(lnode);

      console.log("created a new node", lnode, ". nodes:", this.nodes);
    }

    if (rnode == null) {
      rnode = new Node(right);
      this.nodes.push(rnode);

      console.log("created a new node", rnode, ". nodes:", this.nodes);
    }

    if (!lnode.children.includes(rnode)) {
      lnode.children.push(rnode);
      changed = true;
    }

    if (!rnode.children.includes(lnode)) {
      rnode.children.push(lnode);
      changed = true;
    }

    if (changed) {
      this.displayList.emit(this.getDisplayList());
    }

    return changed;
  }

  private disconnect(s: string): boolean {
    console.info("*disconnected* event:", s);
    const sides = s.split(LEFT_RIGHT_DELIMITER);
    const left = new Set(sides[0].split(DISPLAY_DELIMITER));
    const right = new Set(sides[1].split(DISPLAY_DELIMITER));

    let changed = false;

    const lnode = this.getNodeByDisplays(left);
    const rnode = this.getNodeByDisplays(right);

    if (lnode == null || rnode == null) {
      return false;
    }

    if (lnode.children.includes(rnode) || rnode.children.includes(lnode)) {
      changed = true;

      lnode.children = lnode.children.filter(n => n !== rnode);
      rnode.children = rnode.children.filter(n => n !== lnode);
    }

    if (changed) {
      this.displayList.emit(this.getDisplayList());
    }

    return changed;
  }

  private update() {
    this.displayList.emit(this.getDisplayList());

    this.socket.getEventListener().subscribe(event => {
      if (event.type === MESSAGE) {
        const e: Event = event.data;

        switch (e.Key) {
          case CONNECT:
            this.connect(e.Value);
            break;
          case DISCONNECT:
            this.disconnect(e.Value);
            break;
        }
      }
    });
  }

  private handleError<T>(operation: string, result?: T) {
    return (error: any): Observable<T> => {
      console.error("error doing %s err: $s", operation, error);
      return of(result as T);
    };
  }

}

/*
 *  Represents an array of displays that a preset can share to.
 */
class Node {
  displays: Set<string>;
  children: Node[] = [];

  constructor(displays: Set<string>) {
    this.displays = displays;
  }

  public matches(list: Set<string>): boolean {
    if (this.displays.size !== list.size) {
      return false;
    }

    for (const d of Array.from(this.displays)) {
      if (!list.has(d)) {
        return false;
      }
    }

    return true;
  }
}
