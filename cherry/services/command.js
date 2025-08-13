const TIMEOUT = 12 * 1000;

class CommandRequest {
  constructor(req, delay) {
    this.req = req;
    this.delay = delay || 0;
  }
}

class CommandService {
  constructor(http, data, api, dialog) {
    this.http = http;
    this.data = data;
    this.api = api;
    this.dialog = dialog;
    this.options = {
      headers: { 'Content-Type': 'application/json' }
    };
  }

  async put(data) {
    try {
      return await this.withTimeout(this.http.put(APIService.apiurl, data, this.options), TIMEOUT);
    } catch (err) {
      this.handleError('put', err);
      return null;
    }
  }

  async putWithCustomTimeout(data, customTimeout) {
    try {
      return await this.withTimeout(this.http.put(APIService.apiurl, data, this.options), customTimeout);
    } catch (err) {
      this.handleError('putWithCustomTimeout', err);
      return null;
    }
  }

  async setPower(p, displays) {
    console.log('Setting power to', p, 'on', displays);
    const prev = Display.getPower(displays);
    Display.setPower(p, displays);

    const body = {
      displays: displays.map(d => ({ name: d.name, power: p }))
    };

    const result = await this.put(body);
    if (result !== null) {
      console.log("Power set successfully");
      return true;
    } else {
      Display.setPower(prev, displays);
      return false;
    }
  }

  async setInput(preset, input, displays)  {
    console.log("Changing input on", displays, "to", input.name);

    const prevInput = Display.getInput(displays);
    Display.setInput(input, displays);

    const prevBlank = Display.getBlank(displays);
    Display.setBlank(false, displays);

    const body = {
      displays: displays.map(d => ({
        name: d.name,
        input: input.name,
        blanked: false
      }))
    };

    const changeInputReq = new CommandRequest({ method: "PUT", url: APIService.apiurl, body }, 0);
    const requests = [changeInputReq];

    const commandsToUse = preset.displays.some(
      d => d.input && d.input.name !== input.name
    )
      ? preset.commands.inputDifferent
      : preset.commands.inputSame;

    if (commandsToUse) {
      for (const cmd of commandsToUse) {
        requests.push(this.buildRequest(cmd));
      }
    }

    const success = await this.executeRequests(requests, 1, 14 * 1000);
    if (!success) {
      Display.setInput(prevInput, displays);
      Display.setBlank(prevBlank, displays);
    }

    return success;
  }

  async setBlank(blanked, displays) {
    console.log("Setting blanked to", blanked, "on", displays);
    const prev = Display.getBlank(displays);
    Display.setBlank(blanked, displays);

    const body = {
      displays: displays.map(d => ({ name: d.name, blanked }))
    };

    const result = await this.put(body);
    if (result !== null) {
      return true;
    } else {
      Display.setBlank(prev, displays);
      return false;
    }
  }

  async setVolume(v, audioDevices) {
    console.log("Changing volume to", v, "on", audioDevices);
    const prev = AudioDevice.getVolume(audioDevices);
    AudioDevice.setVolume(v, audioDevices);

    const body = {
      audioDevices: audioDevices.map(a => ({ name: a.name, volume: v }))
    };

    const result = await this.put(body);
    if (result !== null) {
      return true;
    } else {
      AudioDevice.setVolume(prev, audioDevices);
      return false;
    }
  }

  async setMute(m, audioDevices) {
    console.log("Changing mute to", m, "on", audioDevices);
    const prev = AudioDevice.getMute(audioDevices);
    AudioDevice.setMute(m, audioDevices);

    const body = {
      audioDevices: audioDevices.map(a => ({ name: a.name, muted: m }))
    };

    const result = await this.put(body);
    if (result !== null) {
      return true;
    } else {
      AudioDevice.setMute(prev, audioDevices);
      return false;
    }
  }

  async setMuteAndVolume(m, v, audioDevices) {
    console.log("Changing volume to", v, "and mute to", m, "on", audioDevices);
    const prevMute = AudioDevice.getMute(audioDevices);
    const prevVol = AudioDevice.getVolume(audioDevices);

    AudioDevice.setMute(m, audioDevices);
    AudioDevice.setVolume(v, audioDevices);

    const body = {
      audioDevices: audioDevices.map(a => ({
        name: a.name,
        volume: v,
        muted: m
      }))
    };

    const result = await this.put(body);
    if (result !== null) {
      return true;
    } else {
      AudioDevice.setMute(prevMute, audioDevices);
      AudioDevice.setVolume(prevVol, audioDevices);
      return false;
    }
  }

  async setMasterVolume(v, preset) {
    console.log("Changing master volume to", v, "for preset", preset);
    const prev = preset.masterVolume;
    preset.masterVolume = v;

    const body = {
      audioDevices: preset.audioDevices.map(a => ({
        name: a.name,
        volume: Math.round(a.mixlevel * (v / 100)),
        muted: a.mixmute
      }))
    };

    const result = await this.put(body);
    if (result !== null) {
      this.sendEvent("master-volume", v, preset);
      return true;
    } else {
      preset.masterVolume = prev;
      return false;
    }
  }

  async setMasterMute(m, preset) {
    console.log("Changing master mute to", m, "for preset", preset);
    const prev = preset.masterMute;
    preset.masterMute = m;

    const body = {
      audioDevices: preset.audioDevices.map(a => ({
        name: a.name,
        muted: a.mixmute || m
      }))
    };

    const result = await this.put(body);
    if (result !== null) {
      this.sendEvent("master-mute", m, preset);
      return true;
    } else {
      preset.masterMute = prev;
      return false;
    }
  }

  async setMixLevel(v, audioDevice, preset) {
    console.log("Changing mix level to", v, "for audioDevice", audioDevice);
    const prev = audioDevice.mixlevel;
    audioDevice.mixlevel = v;

    const body = {
      audioDevices: [{
        name: audioDevice.name,
        volume: Math.round(v * (preset.masterVolume / 100))
      }]
    };

    const result = await this.put(body);
    if (result !== null) {
      this.sendEvent("mix-level", v, preset, audioDevice);
      return true;
    } else {
      audioDevice.mixlevel = prev;
      return false;
    }
  }

  async setMixMute(m, audioDevice, preset) {
    console.log("Changing mix mute to", m, "for audioDevice", audioDevice);
    const prev = audioDevice.mixmute;
    audioDevice.mixmute = m;

    const body = {
      audioDevices: [{ name: audioDevice.name, muted: m }]
    };

    const result = await this.put(body);
    if (result !== null) {
      this.sendEvent("mix-mute", m, preset, audioDevice);
      return true;
    } else {
      audioDevice.mixmute = prev;
      return false;
    }
  }

  async powerOnDefault(preset) {
    console.log("Powering on default preset:", preset.name);
    const body = {
      displays: preset.displays.map(d => ({
        name: d.name,
        power: "on",
        input: preset.inputs[0].name,
        blanked: false
      })),
      audioDevices: preset.audioDevices.map(a => ({
        name: a.name,
        muted: false,
        volume: 30
      }))
    };
    preset.masterMute = false;

    const requests = [
      new CommandRequest({ method: "PUT", url: APIService.apiurl, body })
    ];

    if (preset.commands.powerOn) {
      for (const cmd of preset.commands.powerOn) {
        requests.push(this.buildRequest(cmd));
      }
    }
    if (preset.commands.inputSame) {
      for (const cmd of preset.commands.inputSame) {
        requests.push(this.buildRequest(cmd));
      }
    }
    if (preset.cameras) {
      for (const camera of preset.cameras) {
        if (camera.presets[0].setPreset) {
          requests.push(new CommandRequest({ method: "GET", url: camera.presets[0].setPreset }));
        }
      }
    }

    return await this.executeRequests(requests, 1, 20 * 1000);
  }

  async powerOff(preset) {
    const body = {
      displays: preset.displays.map(d => ({
        name: d.name,
        power: "standby",
        input: preset.inputs[0].name
      })),
      audioDevices: preset.audioDevices.map(a => ({
        name: a.name,
        muted: false,
        volume: 30
      }))
    };
    preset.masterMute = false;

    const requests = [
      new CommandRequest({ method: "PUT", url: APIService.apiurl, body })
    ];
    if (preset.commands.powerOff) {
      for (const cmd of preset.commands.powerOff) {
        requests.push(this.buildRequest(cmd));
      }
    }

    return await this.executeRequests(requests, 1, 20 * 1000);
  }

  async powerOffAll() {
    const body = { power: "standby" };
    const result = await this.put(body);
    return result !== null;
  }

  async viaControl(viaInput, endpoint) {
    const config = this.data.getInputConfiguration(viaInput);
    const url = `${APIService.apihost}:8014/via/${config.address}/${endpoint}`;
    try {
      const result = await this.http.request({ method: "GET", url });
      return true;
    } catch (err) {
      this.handleError("viaControl", err);
      return false;
    }
  }

  buttonPress(value, data) {
    const event = new Event();
    event.EventTags = ["ui-event", "cherry-ui"];
    event.AffectedRoom = new BasicRoomInfo(`${APIService.building}-${APIService.roomName}`);
    event.TargetDevice = new BasicDeviceInfo(APIService.piHostname);
    event.GeneratingSystem = APIService.piHostname;
    event.Timestamp = new Date();
    event.User = "";
    event.Data = data;
    event.Key = "user-interaction";
    event.Value = value;
    this.api.sendEvent(event);
  }

  sendEvent(key, value, preset, audioDevice) {
    const event = new Event();
    event.User = APIService.piHostname;
    event.Timestamp = new Date();
    event.EventTags = ["ui-communication"];
    event.AffectedRoom = new BasicRoomInfo(`${APIService.building}-${APIService.roomName}`);
    event.TargetDevice = new BasicDeviceInfo(`${APIService.building}-${APIService.roomName}-${preset.name}`);
    event.Key = key;
    event.Value = String(value);
    event.Data = preset.name;
    this.api.sendEvent(event);
  }

  async executeRequests(requests, maxTries, timeOut) {
    if (!requests.length) {
      await new Promise(resolve => setTimeout(resolve, 250));
      return false;
    }
    const results = await Promise.all(
      requests.map(req => this.executeRequest(req, maxTries, timeOut))
    );
    return results.every(success => success);
  }

  async executeRequest(req, maxTries, timeOut) {
    await new Promise(resolve => setTimeout(resolve, req.delay));
    while (maxTries > 0) {
      try {
        const result = await this.withTimeout(this.http.request(req.req), timeOut);
        return true;
      } catch (err) {
        console.error("Error executing request:", req.req, err);
        this.handleError("executeRequest", err);
        maxTries--;
        if (maxTries > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    return false;
  }

  buildRequest(cmd) {
    return new CommandRequest({
      method: cmd.method,
      url: `${APIService.apihost}:${cmd.port}/${cmd.endpoint}`,
      body: cmd.body
    }, cmd.delay);
  }

  async withTimeout(promise, ms) {
    let timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error("Timeout")), ms);
    });
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeout);
    return result;
  }

  handleError(operation, error) {
    console.error(`Error during ${operation}:`, error);
  }
}

const http = {
  async put(url, body, options) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: options.headers,
      body: JSON.stringify(body)
    });
    return response.json();
  },

  async request({ method, url, body }) {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null
    });
    return response.json();
  }
};
