class APIService extends EventTarget {
    static loaded = false;
    static building = null;
    static roomName = null;
    static piHostname = null;
    static hostname = null;
    static apiurl = null;
    static camLink = null;
    static phoneNumber = null;

    static room = new Room();
    static apihost = null;
    static localurl = "http://localhost:8888";
    static options = {
        headers: { "Content-Type": "application/json" }
    };

    static resetForTesting() {
        APIService.apihost = null;
        APIService.localurl = null;
        APIService.options = null;
    }

    constructor(themeService) {
        super();
        this.init(themeService);
    }

    async init(themeService) {
        await themeService.fetchTheme();
        console.log("OPTIONS: ", APIService.options);
        await this.setupHostname();
    }
    emitLoaded(value) {
        this.dispatchEvent(new CustomEvent('loaded', { detail: value }));
    }

    async setupHostname() {
        try {
            const data = await this.getJSON(APIService.localurl + "/hostname");
            APIService.hostname = String(data);
            this.setupPiHostname();
        } catch (err) {
            console.error("getHostname failed", err);
            setTimeout(() => this.setupHostname(), 5000);
        }
    }

    async setupPiHostname() {
        try {
            const data = await this.getJSON(APIService.localurl + "/pihostname");
            APIService.piHostname = String(data);

            const split = APIService.piHostname.split("-");
            APIService.building = split[0];
            APIService.roomName = split[1];

            this.setupAPIUrl(false);
        } catch (err) {
            console.error("getPiHostname failed", err);
            setTimeout(() => this.setupPiHostname(), 5000);
        }
    }

    async setupAPIUrl(next) {
        if (next) {
            console.warn("Switching to next API");
            try {
                await this.getJSON(APIService.localurl + "/nextapi");
            } catch (err) {
                console.error("getNextAPIUrl failed", err);
                setTimeout(() => this.setupAPIUrl(next), 5000);
            }
        }

        try {
            const data = await this.getJSON(APIService.localurl + "/api");
            APIService.apihost = "http://" + location.hostname;
            if (!data.hostname.includes("localhost")) {
                APIService.apihost = "http://" + data.hostname;
            }
            APIService.apiurl = `http://localhost:8000/buildings/${APIService.building}/rooms/${APIService.roomName}`;
            console.info("API url:", APIService.apiurl);

            if (!next) {
                this.setupUIConfig();
            }
        } catch (err) {
            console.error("getAPIUrl failed", err);
            setTimeout(() => this.setupAPIUrl(next), 5000);
        }
    }

    async setupUIConfig() {
        try {
            const data = await this.getJSON(APIService.localurl + "/uiconfig");
            APIService.room.uiconfig = new UIConfiguration();
            Object.assign(APIService.room.uiconfig, data);
            console.info("UI Configuration:", APIService.room.uiconfig);

            this.setupRoomConfig();
        } catch (err) {
            console.error("getUIConfig failed", err);
            setTimeout(() => this.setupUIConfig(), 5000);
        }
    }

    async setupRoomConfig() {
        try {
            const data = await this.getJSON(`${APIService.apiurl}/configuration`);
            APIService.room.config = new RoomConfiguration();
            Object.assign(APIService.room.config, data);

            console.info("Room Configuration:", APIService.room.config);
            this.setupRoomStatus();
        } catch (err) {
            console.error("getRoomConfig failed", err);
            setTimeout(() => this.setupRoomConfig(), 5000);
        }
    }

    async setupRoomStatus() {
        try {
            const data = await this.getJSON(APIService.apiurl);
            APIService.room.status = new RoomStatus();
            Object.assign(APIService.room.status, data);

            APIService.loaded = true; // mark that it’s loaded
            this.emitLoaded(true);
        } catch (err) {
            console.error("getRoomStatus failed", err);
            setTimeout(() => this.setupRoomStatus(), 5000);
        }
    }


    monitorAPI() {
        setTimeout(async () => {
            try {
                const data = await this.getJSON(`${APIService.apihost}:8000/mstatus`);
                if (data.statuscode !== 0) {
                    this.setupAPIUrl(true);
                }
            } catch (err) {
                console.error("getAPIHealth failed", err);
                this.setupAPIUrl(true);
            } finally {
                this.monitorAPI();
            }
        }, 30000);
    }

    async sendEvent(event) {
        try {
            console.log("sending event", event);
            await fetch(APIService.localurl + "/publish", {
                method: "POST",
                headers: APIService.options.headers,
                body: JSON.stringify(event)
            });
        } catch (err) {
            console.error("Failed to send event", err);
        }
    }

    async help(type) {
        const body = {
            building: APIService.building,
            room: APIService.roomName
        };

        try {
            switch (type) {
                case "help":
                    console.log("sending help request");
                    await this.postJSON(APIService.localurl + "/help", body);
                    break;
                case "confirm":
                    await this.postJSON(APIService.localurl + "/confirmhelp", body);
                    break;
                case "cancel":
                    await this.postJSON(APIService.localurl + "/cancelhelp", body);
                    break;
            }
        } catch (err) {
            console.error(`Help request failed for ${type}`, err);
        }
    }

    async getJSON(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }

    async postJSON(url, body) {
        const response = await fetch(url, {
            method: "POST",
            headers: APIService.options.headers,
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
}
