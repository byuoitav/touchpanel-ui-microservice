import { Injectable, EventEmitter } from "@angular/core";
import { Http } from "@angular/http";

import { DeviceConfiguration } from "../objects/objects";
import { APIService } from "./api.service";
import { DataService } from "./data.service";
import { SocketService, MESSAGE, Event } from "./socket.service";

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
 *      eventInfoKey:   "OPENED",
 *      eventInfoValue: "D4,D5,D6/D7,D8,D9"
 *  }
 */

const CONNECT = "connect";
const DISCONNECT = "disconnect";
const LEFT_RIGHT_DELIMITER = "%";
const PRESET_DELIMITER = "|";

@Injectable()
export class GraphService {
  public presetList: EventEmitter<Set<string>>;

  private root: Node;
  private exists = false;
  private nodes: Node[] = [];

  private dividerSensor: DeviceConfiguration;

  constructor(
    private data: DataService,
    private socket: SocketService,
    private http: Http
  ) {
    this.presetList = new EventEmitter<Set<string>>();

    this.data.loaded.subscribe(() => {
      this.init();
    });
  }

  public init() {
    if (this.exists || !this.data.panel.preset.shareablePresets) {
      return;
    }

    // the root node is the set of presets and shareablePresets for the preset
    const presets: Set<string> = new Set();
    presets.add(this.data.panel.preset.name);
    this.data.panel.preset.shareablePresets.forEach(p => presets.add(p));

    this.root = new Node(presets);
    this.nodes.push(this.root);
    this.exists = true;

    // get the current connected/disconnected state
    this.dividerSensor = APIService.room.config.devices.find(d =>
      d.hasRole("DividerSensor")
    );
    console.log("dividerSensor", this.dividerSensor);

    this.getDividerSensorStatus();
    this.update();

    console.log("root", this.root);
  }

  public getPresetList(): Set<string> {
    const ret: Set<string> = new Set();

    this.getpresetlist(this.root, ret);
    return ret;
  }

  /*
   * recursivly descends through nodes and adds their presets to the list
   */
  private getpresetlist(node: Node, list: Set<string>): Set<string> {
    let presets = Array.from(node.presets);
    presets = presets.filter(p => !list.has(p));

    if (presets.length > 0) {
      presets.forEach(p => list.add(p));

      for (const child of node.children) {
        this.getpresetlist(child, list);
      }
    }

    return list;
  }

  /*
   * gets the status of the room from the divider sensor.
   * loops through the connected events and adds connected nodes until
   * there isnt' a change in my presets.
   *
   * loops through the disconnected events and disconnects presets that may be disconnected.
   *      TODO (?) is this necessary? or should i just assume they are disconnected.
   */
  private getDividerSensorStatus() {
    if (this.dividerSensor != null) {
      this.http
        .get("http://" + this.dividerSensor.address + ":10000/divider/state")
        .map(res => res.json())
        .subscribe(
          data => {
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
          err => {
            setTimeout(this.getDividerSensorStatus, 5000);
          }
        );
    }
  }

  private getNodeByPresets(list: Set<string>): Node {
    for (const node of this.nodes) {
      if (node.matches(list)) {
        return node;
      }
    }
  }

  private connect(s: string): boolean {
    console.info("*connected* event:", s);
    const sides = s.split(LEFT_RIGHT_DELIMITER);
    const left = new Set(sides[0].split(PRESET_DELIMITER));
    const right = new Set(sides[1].split(PRESET_DELIMITER));

    let changed = false;

    let lnode = this.getNodeByPresets(left);
    let rnode = this.getNodeByPresets(right);

    if (lnode == null) {
      lnode = new Node(left);
      this.nodes.push(lnode);

      console.log("created a new left node", lnode, ". nodes:", this.nodes);
    }

    if (rnode == null) {
      rnode = new Node(right);
      this.nodes.push(rnode);

      console.log("created a new right node", rnode, ". nodes:", this.nodes);
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
      this.presetList.emit(this.getPresetList());
    }

    return changed;
  }

  private disconnect(s: string): boolean {
    console.info("*disconnected* event:", s);
    const sides = s.split(LEFT_RIGHT_DELIMITER);
    const left = new Set(sides[0].split(PRESET_DELIMITER));
    const right = new Set(sides[1].split(PRESET_DELIMITER));

    let changed = false;

    const lnode = this.getNodeByPresets(left);
    const rnode = this.getNodeByPresets(right);

    if (lnode == null || rnode == null) {
      return false;
    }

    if (lnode.children.includes(rnode) || rnode.children.includes(lnode)) {
      changed = true;

      lnode.children = lnode.children.filter(n => n !== rnode);
      rnode.children = rnode.children.filter(n => n !== lnode);
    }

    if (changed) {
      this.presetList.emit(this.getPresetList());
    }

    return changed;
  }

  private update() {
    this.presetList.emit(this.getPresetList());

    this.socket.getEventListener().subscribe(event => {
      if (event.type === MESSAGE) {
        // let ew: EventWrapper = event.data;
        // let e: Event = ew.event;
        const e = event.data;

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
}

/*
 *  Represents an array of presets that a preset can share to.
 */
class Node {
  presets: Set<string>;
  children: Node[] = [];

  constructor(presets: Set<string>) {
    this.presets = presets;
  }

  public matches(list: Set<string>): boolean {
    if (this.presets.size !== list.size) {
      return false;
    }

    for (const d of Array.from(this.presets)) {
      if (!list.has(d)) {
        return false;
      }
    }

    return true;
  }
}
