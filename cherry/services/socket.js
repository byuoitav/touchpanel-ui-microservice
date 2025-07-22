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


// BasicRoomInfo
class BasicRoomInfo {
    constructor(roomID) {
        this.BuildingID = "";
        this.RoomID = "";

        if (roomID == null || roomID === undefined) return;

        const split = roomID.split("-");
        if (split.length === 2) {
            this.BuildingID = split[0];
            this.RoomID = split[0] + "-" + split[1];
        }
    }
}

// BasicDeviceInfo
class BasicDeviceInfo {
    constructor(deviceID) {
        this.BuildingID = "";
        this.RoomID = "";
        this.DeviceID = "";

        if (deviceID == null || deviceID === undefined) return;

        const split = deviceID.split("-");
        if (split.length === 3) {
            this.BuildingID = split[0];
            this.RoomID = split[0] + "-" + split[1];
            this.DeviceID = split[0] + "-" + split[1] + "-" + split[2];
        }
    }
}

// DateConverter
class DateConverter {
    static serialize(date) {
        function pad(n) {
            return n < 10 ? "0" + n : n;
        }

        return (
            date.getUTCFullYear() +
            "-" +
            pad(date.getUTCMonth() + 1) +
            "-" +
            pad(date.getUTCDate()) +
            "T" +
            pad(date.getUTCHours()) +
            ":" +
            pad(date.getUTCMinutes()) +
            ":" +
            pad(date.getUTCSeconds()) +
            "Z"
        );
    }

    static deserialize(dateStr) {
        return new Date(dateStr);
    }
}

// Event
class Event {
    constructor() {
        this.GeneratingSystem = "";
        this.Timestamp = undefined;  // Date
        this.EventTags = [];         // Array of strings
        this.TargetDevice = new BasicDeviceInfo(undefined);
        this.AffectedRoom = new BasicRoomInfo(undefined);
        this.Key = "";
        this.Value = "";
        this.User = "";
        this.Data = undefined;       // any
    }

    hasTag(tag) {
        return this.EventTags.includes(tag);
    }
}

