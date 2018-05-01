import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { DeviceConfiguration } from '../objects/objects';
import { APIService } from './api.service';
import { DataService } from './data.service';
import { SocketService, MESSAGE, EventWrapper, Event } from './socket.service';

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

const CONNECT: string = "connect";
const DISCONNECT: string = "disconnect";
const LEFT_RIGHT_DELIMITER: string = "/";
const DISPLAY_DELIMITER: string = ",";

@Injectable()
export class GraphService {

    private root: Node;
    private exists: boolean = false;

    private dividerSensor: DeviceConfiguration;

    constructor(private data: DataService, private socket: SocketService, private http: Http) {
        this.data.loaded.subscribe(() => {
            this.init();
        });
    }

    public init() {
        if (this.exists) {
            return; 
        }

        if (this.data.panel.preset.shareableDisplays == null) 
            return;

        // the root node is the set of displays and shareableDisplays for the preset
        let displays: Set<string> = new Set();
        this.data.panel.preset.displays.forEach(d => displays.add(d.name));
        this.data.panel.preset.shareableDisplays.forEach(d => displays.add(d));

        this.root = new Node(displays);
        this.exists = true;

        // get the current connected/disconnected state
        this.dividerSensor = APIService.room.config.devices.find(d => d.hasRole("DividerSensor"))
        console.log("dividerSensor", this.dividerSensor)

        this.getDividerSensorStatus();

        this.update();

        console.log("root", this.root);
    }

    public getDisplayList(): Set<string> {
        let ret: Set<string> = new Set();

        this.getdisplaylist(this.root, ret);
        return ret;
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
            this.http.get("http://" + this.dividerSensor.address + ":8200/status")
                .map(res => res.json())
                .subscribe(
                    data => {
                        if (data["connected"] != null) {
                            let numChanged: number;
                            do {
                                numChanged = 0;

                                for (let connected of data["connected"]) {
                                    if (this.connect(connected))
                                        ++numChanged;
                                }
                            } while(numChanged > 0);
                        }

                        if (data["disconnected"] != null) {
                            for (let disconnected of data["disconnected"]) {
                                this.disconnect(disconnected);
                            }
                        }
                    }, err => {
                        setTimeout(this.getDividerSensorStatus, 5000);
                    }
                );
        }
    }

    /*
     * recursivly descends through nodes and adds their displays to the list
     */
    private getdisplaylist(node: Node, list: Set<string>): Set<string> {
        node.displays.forEach(d => list.add(d));

        for (let child of node.children) {
            this.getdisplaylist(child, list); 
        }

        return list; 
    }

    public findMatchingNode(list: Set<string>): Node {
        return this.findmatchingnode(this.root, list);
    }

    private findmatchingnode(node: Node, list: Set<string>): Node {
        if (node.matches(list)) return node;

        for (let child of node.children) {
            let ret: Node = this.findmatchingnode(child, list);
            if (ret != null)
                return ret;
        }

        return null;
    }

    private connect(s: String): boolean {
        console.info("*connected* event:", s);
        let sides = s.split(LEFT_RIGHT_DELIMITER);
        let left = new Set(sides[0].split(DISPLAY_DELIMITER));
        let right = new Set(sides[1].split(DISPLAY_DELIMITER));

        let changed = false;

        let node: Node = this.findMatchingNode(left);
        if (node != null) {
            node.children.push(new Node(right));
        } else {
            node = this.findMatchingNode(right);

            if (node != null) {
                console.log("adding node:", node);
                node.children.push(new Node(left));
                changed = true;
            }
        }

        console.log("updated root node:", this.root, ". updated display list:", this.getDisplayList());
        return changed;
    }

    private disconnect(s: String): boolean {
        console.info("*disconnected* event:", s);
        let sides = s.split(LEFT_RIGHT_DELIMITER);
        let left = new Set(sides[0].split(DISPLAY_DELIMITER));
        let right = new Set(sides[1].split(DISPLAY_DELIMITER));
        let changed = false;

        let leftNode: Node = this.findMatchingNode(left);
        let rightNode: Node = this.findMatchingNode(right);

        if (leftNode != null && rightNode != null) {

            for (let i = 0; i < leftNode.children.length; ++i) {
                if (leftNode.children[i] === rightNode) {
                    console.log("removing", leftNode);
                    leftNode.children.splice(i);
                    changed = true;
                    break;
                }
            }

            if (!changed) {
                for (let i = 0; i < rightNode.children.length; ++i) {
                    if (rightNode.children[i] === leftNode) {
                        console.log("removing", rightNode);
                        rightNode.children.splice(i);
                        changed = true;
                        break;
                    }
                }
            }
        }

        console.log("updated root node:", this.root, ". updated display list:", this.getDisplayList());
        return changed;
    }

    private update() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let ew: EventWrapper = event.data;
                let e: Event = ew.event; 

                switch (e.eventInfoKey) {
                    case CONNECT: 
                        this.connect(e.eventInfoValue);
                        break;
                    case DISCONNECT:
                        this.disconnect(e.eventInfoValue);
                        break;
                }
            } 
        }); 
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
        if (this.displays.size !== list.size) return false;

        for (let d of Array.from(this.displays)) {
            if (!list.has(d)) {
                return false;
            }
        }

        return true;
    }
}
