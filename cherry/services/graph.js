class GraphService extends EventTarget {
  constructor(dataService, socketService) {
    super();
    this.data = dataService;
    this.socket = socketService;

    this.displayList = new Set();

    this.root = null;
    this.exists = false;
    this.nodes = [];

    this.dividerSensor = null;

    this.initListener();
  }

  initListener() {
    this.data.getEventListener().addEventListener("loaded", () => {
      this.init();
    });
  }

  init() {
    if (this.exists) return;

    if (!this.data.panel.preset.shareableDisplays) return;

    const displays = new Set();
    this.data.panel.preset.displays.forEach(d => displays.add(d.name));
    this.data.panel.preset.shareableDisplays.forEach(d => displays.add(d));

    this.root = new Node(displays);
    this.nodes.push(this.root);
    this.exists = true;

    this.dividerSensor = window.APIService.room.config.devices.find(d =>
      d.hasRole("DividerSensor")
    );

    if (this.dividerSensor) {
      console.log("dividerSensor", this.dividerSensor);
      // optionally enable below if needed
      // this.getDividerSensorStatus();
      this.update();
    } else {
      console.warn("no divider sensor found. not listening for division events.");
    }
  }

  getDisplayList() {
    const ret = new Set();
    this.getdisplaylist(this.root, ret);
    return ret;
  }

  getdisplaylist(node, list) {
    let displays = Array.from(node.displays).filter(d => !list.has(d));
    if (displays.length > 0) {
      displays.forEach(d => list.add(d));
      node.children.forEach(child => this.getdisplaylist(child, list));
    }
    return list;
  }

  async getDividerSensorStatus() {
    if (!this.dividerSensor) return;

    try {
      const response = await fetch(`http://${this.dividerSensor.address}:10000/divider/state`);
      const data = await response.json();

      let numChanged;
      if (data.connected) {
        do {
          numChanged = 0;
          for (const connected of data.connected) {
            if (this.connect(connected)) {
              numChanged++;
            }
          }
        } while (numChanged > 0);
      }

      if (data.disconnected) {
        for (const disconnected of data.disconnected) {
          this.disconnect(disconnected);
        }
      }
    } catch (err) {
      console.warn("failed to get divider sensor status, trying again...", err);
      setTimeout(() => this.getDividerSensorStatus(), 5000);
    }
  }

  async setCurrentPreset() {
    try {
      const response = await fetch(`http://${this.dividerSensor.address}:10000/divider/preset/${window.APIService.piHostname}`);
      const data = await response.text();

      const preset = this.data.presets.find(
        p => p.name.toLowerCase() === data.toLowerCase()
      );

      if (preset) {
        console.log("setting initial preset to", preset);
        this.data.panel.preset = preset;
      } else {
        console.error("current preset response doesn't exist. response: ", data);
      }
    } catch (err) {
      console.warn("failed to get initial preset from divider sensor, trying again...", err);
      setTimeout(() => this.setCurrentPreset(), 5000);
    }
  }

  getNodeByDisplays(list) {
    const l = JSON.stringify(Array.from(list));
    return this.nodes.find(n => JSON.stringify(Array.from(n.displays)) === l);
  }

  connect(s) {
    console.info("*connected* event:", s);
    const [leftStr, rightStr] = s.split("/");
    const left = new Set(leftStr.split(","));
    const right = new Set(rightStr.split(","));

    let changed = false;

    let lnode = this.getNodeByDisplays(left);
    let rnode = this.getNodeByDisplays(right);

    if (!lnode) {
      lnode = new Node(left);
      this.nodes.push(lnode);
      console.log("created new node", lnode, "nodes:", this.nodes);
    }
    if (!rnode) {
      rnode = new Node(right);
      this.nodes.push(rnode);
      console.log("created new node", rnode, "nodes:", this.nodes);
    }

    if (!lnode.children.includes(rnode)) {
      lnode.children.push(rnode);
      changed = true;
    }
    if (!rnode.children.includes(lnode)) {
      rnode.children.push(lnode);
      changed = true;
    }

    if (changed) this.emitDisplayList();

    return changed;
  }

  disconnect(s) {
    console.info("*disconnected* event:", s);
    const [leftStr, rightStr] = s.split("/");
    const left = new Set(leftStr.split(","));
    const right = new Set(rightStr.split(","));

    let changed = false;

    const lnode = this.getNodeByDisplays(left);
    const rnode = this.getNodeByDisplays(right);

    if (!lnode || !rnode) return false;

    if (lnode.children.includes(rnode) || rnode.children.includes(lnode)) {
      changed = true;
      lnode.children = lnode.children.filter(n => n !== rnode);
      rnode.children = rnode.children.filter(n => n !== lnode);
    }

    if (changed) this.emitDisplayList();
    return changed;
  }

  update() {
    this.emitDisplayList();
    this.socket.getEventListener().addEventListener("message", e => {
      const event = e.detail;
      switch (event.Key) {
        case "connect":
          this.connect(event.Value);
          break;
        case "disconnect":
          this.disconnect(event.Value);
          break;
      }
    });
  }

  emitDisplayList() {
    this.displayList = this.getDisplayList();
    this.dispatchEvent(new CustomEvent("displayList", { detail: this.displayList }));
  }
}


class Node {
  constructor(displays) {
    this.displays = displays; // Set
    this.children = [];
  }

  matches(list) {
    if (this.displays.size !== list.size) return false;
    for (const d of this.displays) {
      if (!list.has(d)) return false;
    }
    return true;
  }
}
