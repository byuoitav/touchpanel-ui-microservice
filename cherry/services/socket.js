class SocketService extends EventTarget {
  constructor() {
    super();
    this.screenoff = false;
    this.ws = new WebSocket("ws://" + window.location.host + "/websocket");
    console.log("Connecting to websocket...", this.ws);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.dispatchEvent(new CustomEvent("open"));
    };

    this.ws.onclose = () => {
      console.log("WebSocket closed");
      this.dispatchEvent(new CustomEvent("close"));
    }; 

    this.ws.onmessage = (msg) => {
      this.handleMessage(msg.data);
    };
  }

  send(data) {
    this.ws.send(JSON.stringify(data));
  }

  handleMessage(message) {
    try {
      if (typeof message === "string" && message.includes("keepalive")) {
        this.send({ type: "ping" });
      } else if (typeof message === "string" && message.includes("refresh")) {
        console.log("refreshing");
        location.assign("http://" + location.hostname + ":8888/");
      } else if (typeof message === "string" && message.includes("screenoff")) {
        console.log("adding screenoff element");
        this.screenoff = true;
      } else if (typeof message === "string" && message.includes("websocketTest")) {
        console.log("Received Websocket Test Message");
        this.send({ type: "websocketTest" });
      } else {
        let data = message;
        if (typeof data === "string") {
          try { data = JSON.parse(data); } catch (_) { }
        }
        if (typeof data === "string") {
          try { data = JSON.parse(data); } catch (_) { }
        }
        if (data.key && !data.key.includes("Error")) {
          window.DataService.update(data);
        }
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }
}
