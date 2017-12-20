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
const LEFT_RIGHT_DELIMITER: string = "/";
const DISPLAY_DELIMITER: string = ",";

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

    private update() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let e = event.data; 

                let sides: string;
                let left: Set<string>;
                let right: Set<string>; 

                switch (e.eventInfoKey) {
                    case CONNECT: 
                        sides = e.eventInfoValue.split(LEFT_RIGHT_DELIMITER); 
                        left = new Set(sides[0].split(DISPLAY_DELIMITER)); 
                        right = new Set(sides[1].split(DISPLAY_DELIMITER));

                        let node: Node = this.findMatchingNode(left);
                        if (node != null) {
                            node.children.push(new Node(right));
                        } else {
                            node = this.findMatchingNode(right);
                            
                            if (node != null) {
                                console.log("adding node:", node, ". root node:", this.root);
                                node.children.push(new Node(left));
                            }
                        }
                        break;
                    case DISCONNECT: {
                        sides = e.eventInfoValue.split(LEFT_RIGHT_DELIMITER); 
                        left = new Set(sides[0].split(DISPLAY_DELIMITER)); 
                        right = new Set(sides[1].split(DISPLAY_DELIMITER));

                        let leftNode: Node = this.findMatchingNode(left);
                        let rightNode: Node = this.findMatchingNode(right);

                        if (leftNode != null && rightNode != null) {

                            let found = false;
                            for (let i = 0; i < leftNode.children.length; ++i) {
                                if (leftNode.children[i] === rightNode) {
                                    leftNode.children.splice(i);
                                    found = true;
                                    break;
                                }
                            }

                            if (!found) {
                                for (let i = 0; i < rightNode.children.length; ++i) {
                                    if (rightNode.children[i] === leftNode) {
                                        rightNode.children.splice(i);
                                        found = true;
                                        break;
                                    }
                                }
                            }
                        }
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

        for (let d of Array.from(this.displays)) {
            if (!list.has(d)) {
                return false;
            }
        }

        return true;
    }
}
