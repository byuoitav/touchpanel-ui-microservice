import { Injectable } from '@angular/core';

import { DataService } from './data.service';
import { SocketService, MESSAGE } from './socket.service';

/*
 *
 *  When the GraphService recieves an event from a Pi that is monitoring contact points,
 *      it will find the node that's display field matches the full set of displays on one half
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
@Injectable()
export class GraphService {

    private root: Node;
    private exists: boolean = false;


    constructor(private data: DataService, private socket: SocketService) {
    }

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
    private getdisplaylist(node: Node, list: Set<string>) {
        console.log("recursive descent: ", node);
        node.displays.forEach(d => list.add(d));

        node.children.forEach(n => {
            this.getdisplaylist(n, list); 
        });

        return list; 
    }

    private update() {
        this.socket.getEventListener().subscribe(event => {
            if (event.type == MESSAGE) {
                let e = event.data; 

                switch (e.eventInfoKey) {
                    // TODO implement creating/removing nodes
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
}
