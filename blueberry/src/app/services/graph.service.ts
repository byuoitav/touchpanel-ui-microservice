import { Injectable } from '@angular/core';

import { DataService } from './data.service';
import { SocketService, MESSAGE } from './socket.service';

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
const LEFT_RIGHT_BREAKUP: string = "/";

@Injectable()
export class GraphService {

    private root: Node;
    private exists: boolean = false;

    constructor(private data: DataService, private socket: SocketService) { }

    public init() {
        if (this.exists) {
            return; 
        }

        this.data.loaded.subscribe(() => {
            // the root node is the set of displays and shareableDisplays for the preset
            let displays: Set<string> = new Set();
            this.data.panel.preset.displays.forEach(d => displays.add(d.name));
            this.data.panel.preset.shareableDisplays.forEach(d => displays.add(d));

            this.root = new Node(displays);
            this.exists = true;

            this.update();

            console.log("root", this.root);

            let tmp = new Set<string>(["D5", "D7", "D0"]);
            let node = new Node(tmp);

            let tmp2 = new Set<string>(["D5", "D7", "D0"]);
            console.log("testing for match", tmp2);

            let match = this.findMatchingNode(tmp2);
            console.log("match", match);
        });
    }

    public getDisplayList(): Set<string> {
        let ret: Set<string> = new Set();

        this.getdisplaylist(this.root, ret);
        return ret;
    }

    /*
     * recursivly descends through nodes and adds their displays to the list
     */
    private getdisplaylist(node: Node, list: Set<string>): Set<string> {
        node.displays.forEach(d => list.add(d));

        node.children.forEach(n => {
            this.getdisplaylist(n, list); 
        });

        return list; 
    }

    public findMatchingNode(list: Set<string>): Node {
        return this.findmatchingnode(this.root, list);
    }

    private findmatchingnode(node: Node, list: Set<string>): Node {
        if (node.matches(list)) return node;

        node.children.forEach(n => {
            console.log("here", n);
            let ret: Node = this.findmatchingnode(n, list);
            if (ret != null)
                return ret;
        });

        return null;
    }

    private update() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let e = event.data; 

                let sides: string;
                let left: string;
                let right: string; 

                switch (e.eventInfoKey) {
                    case CONNECT: 
                        sides = e.eventInfoValue.split(LEFT_RIGHT_BREAKUP); 
                        left = sides[0]; 
                        right = sides[1];

                        break;
                    case DISCONNECT: {
                    }
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

        console.log("does", this.displays, "match", list, "?");

        for (let d of this.displays) {
            console.log("checking for", d);
            if (!list.has(d)) {
                console.log("doesn't have it");
                return false;
            }
        }

        console.log("yes!");
        return true;
    }
}
