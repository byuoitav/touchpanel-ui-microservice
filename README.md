# touchpanel-ui-microservice

[![Apache 2 License](https://img.shields.io/hexpm/l/plug.svg)](https://raw.githubusercontent.com/byuoitav/touchpanel-ui-microservice/master/LICENSE)

A microservice for the touchpanel UI containing both Blueberry and Cherry. Blueberry and Cherry are the interfaces written in Angular. Provides room control for AV devices and camera control through a touch screen display on a raspberry pi. Angular specific testing information can be found in the `README.md` in `/cherry`. Docs for setting up the Touch Panel on a local machine for development work in `SetUpLocalTP.md`.

## Endpoints

### Status

- <mark>GET</mark> `/status`
    - Returns: bin, statuscode, version, uptime, websocket info

### Log Events

- <mark>POST</mark> `/publish`
    - Send a log event to the event bus

### Websocket

- <mark>GET</mark> `/websocket`
    - Websocket endpoint for the UI
- <mark>PUT</mark> `/screenoff`
    - Sends a screenoff message to the UI, only Blueberry seems to have a significant response
- <mark>PUT</mark> `/refresh`
    - Refreshes the UI app
- <mark>PUT</mark> `/socketTest`
    - Sends the message "socket test" to the UI

### UI Endpoints

- <mark>GET</mark> `/pihostname`
- <mark>GET</mark> `/hostname`
- <mark>GET</mark> `/deviceinfo`
- <mark>GET</mark> `/reboot`
- <mark>GET</mark> `/uiconfig`
    - Returns the UI config
- <mark>GET</mark> `/uipath`
    - Gets the UI Config and then returns the path for the url to where the UI is hosted
    - Ex: "hostname": "/cherry?1.1.15=BDumwFSa"

####

- <mark>GET</mark> `/api`
    - Gets the UI Config and then returns the hostname
- <mark>GET</mark> `/nextapi`
- <mark>GET</mark> `/control-key/:room/:controlGroup`
    - Returns the camera control key for the specified room and control group
- <mark>POST</mark> `/help`
    - Sends a help request event with device info
- <mark>POST</mark> `/confirmhelp`
- <mark>POST</mark> `/cancelhelp`
- <mark>GET</mark> `/helpSchedule`
    - Returns the resolved support schedule for the current room (see [Support Schedule](#support-schedule-cherry) section)
    - Optional `?id=<schedule-id>` to fetch a specific schedule directly

####

- <mark>GET</mark> `/themeconfig`
    - Returns the theme config to set css values and related theme variables in the UI
- <mark>GET</mark> `/logo`
    - Returns the logo for the UI that is displayed on the standby screen
- <mark>GET</mark> `/blueberry/db/:attachment`
- <mark>GET</mark> `/cherry/db/:attachment`

## Environment Variables

- PI_HOSTNAME
    - Ex: PI_HOSTNAME=JET-1234-PI1
- SYSTEM_ID
    - Ex: SYSTEM_ID="JET-1234-PI1"
- DB_ADDRESS
    - CouchDB address
- DB_USERNAME
    - CouchDB Username
- DB_PASSWORD
    - CouchDB Password
- STOP_REPLICATION (boolean)
    - Stop replication of CouchDB
- HUB_ADDRESS

Hostname/SystemID should be set [according to the documentation](https://github.com/byuoitav/team/wiki/Hostname-Naming-Conventions).

## UI Config (Cherry)

Lists the devices and features for the room. Configures what options and devices appear in the UI. Provides endpoints for camera control if applicable. Holds the name of the theme document in CouchDB. If the theme is not found, the UI will look for a theme called "default".

```
{
    "_id": "JET-1234",
    "api": [
        "localhost"
    ],
    "panels": [
        {
            "hostname": "JET-1234-PI1",
            "uipath": "/cherry",
            "preset": "JET 1234",
            "features": [],
            "theme": "jetTheme"
        }
    ],
    "presets": [
        {
            "name": "JET 1234",
            "icon": "videocam",
            "displays": [
                "D1",
                "D2"
            ],
            "shareablePresets": null,
            "shareableDisplays": null,
            "audioDevices": [
                "D1"
            ],
            "inputs": [
                "PC1",
                "ATV1",
                "HDMI1",
                "HDMI2"
            ],
            "commands": {
                "powerOn": [
                    {
                        "method": "PUT",
                        "port": 5858,
                        "endpoint": "buildings/JET/rooms/1234",
                        "body": {
                            "audioDevices": [
                                {}
                            ]
                        }
                    }
                ]
            },
            "screens": null,
            "cameras": [
                {
                    "displayName": "Camera",
                    "tiltUp": "https://cameras.example.com/JET-1234-CAM.example.com:22000/pantilt/up",
                    "tiltDown": "https://cameras.example.com/JET-1234-CAM.example.com:22000/pantilt/down",
                    "panLeft": "https://cameras.example.com/JET-1234-CAM.example.com:22000/pantilt/left",
                    "panRight": "https://cameras.example.com/JET-1234-CAM.example.com:22000/pantilt/right",
                    "panTiltStop": "https://cameras.example.com/JET-1234-CAM.example.com:22000/pantilt/stop",
                    "zoomIn": "https://cameras.example.com/JET-1234-CAM.example.com:22000/zoom/in",
                    "zoomOut": "https://cameras.example.com/JET-1234-CAM.example.com:22000/zoom/out",
                    "zoomStop": "https://cameras.example.com/JET-1234-CAM.example.com:22000/zoom/stop",
                    "presets": [
                        {
                            "displayName": "Room",
                            "setPreset": "https://cameras.example.com/JET-1234-CAM.example.com:22000/preset/0"
                        }
                    ]
                }
            ],
            "recording": {
                "start": "http://localhost:2024/192.168.0.56/JET1234JACK1/volume/mute",
                "stop": "http://localhost:2024/192.168.0.56/JET1234JACK1/volume/unmute",
                "maxTime": 120
            }
        }
    ],
    "inputConfiguration": [
        {
            "name": "ATV1",
            "icon": "settings_input_antenna"
        },
        {
            "name": "HDMI1",
            "icon": "settings_input_hdmi"
        },
        {
            "name": "HDMI2",
            "icon": "settings_input_hdmi"
        },
        {
            "name": "PC1",
            "icon": "desktop_windows"
        },
        {
            "name": "CLEVERTOUCH",
            "icon": "android"
        }
    ],
    "outputConfiguration": [
        {
            "name": "C1",
            "icon": "videocam"
        },
        {
            "name": "C2",
            "icon": "videocam"
        }
    ],
    "audioConfiguration": []
}
```

## Theme Configuration (Cherry)

Configures the appearance of the UI through CSS variables. Gives control over setting the font and allows for the standby screen logo to be uploaded as an attachment in Couch called logo.svg.

```
{
  "_id": "JET-1234",
  "_rev": "7-85d0a5e2bfe58b92c8edbd43a017945b",
  "background-color": "#633834",
  "top-bar-color": "#2e2322",
  "background-color-accent": "#de5a4d",
  "dpad-color": "#e3e3e3",
  "dpad-press": "#777777",
  "cam-preset-color": "#455a64",
  "cam-preset-press": "orange",
  "show-cam-text": true,
  "phone-number": "801-422-TEST",
  "cam-link": "cameras.example.com",
  "volume-slider-color": "#20956b",
  "help-button-color": "#214e4b",
  "text-color": "white",
  "font-link": "https://cdn.example.com/theme-fonts/1.x.x/ringside/fonts.css",
  "font-name": "HCo Ringside Narrow SSm",
  "_attachments": {
    "logo.svg": {
      "content_type": "image/svg+xml",
      "revpos": 3,
      "digest": "md5-JcROa8W/ytaYTyB47XprDg==",
      "length": 9622,
      "stub": true
    }
  }
}
```

## Support Schedule (Cherry)

The support schedule system controls the help button behavior — what message is shown, whether a help request button is available, and what phone number to display. Schedules are stored in the `support-schedule` CouchDB database.

### Endpoint

- <mark>GET</mark> `/helpSchedule`
    - Optional query param `?id=<schedule-id>` to fetch a specific schedule (useful for testing/debugging)
    - Without `?id`, the system automatically resolves the schedule for the current room (see resolution order below)

### Schedule Resolution Order

1. **Building-specific schedule** — The building document (derived from `SYSTEM_ID`, e.g. `JET` from `JET-1234-CP1`) is looked up in the `buildings` database. If the building has a `support-schedule` field set, that schedule ID is used.
2. **Default schedule** — If no building-specific schedule is found, `default-schedule` is used.

### Override Chain

Each schedule document can specify an `over-ride` field pointing to another schedule ID. The system follows this chain until it reaches a schedule with no override. This allows temporary schedule changes (summer hours, holidays, etc.) without modifying the default or building schedule.

- The override chain supports unlimited depth
- **Cycle protection**: If a circular reference is detected (A → B → A), the last valid schedule is used
- **Missing override**: If an override points to a non-existent schedule, the last valid schedule in the chain is used
- To activate a temporary schedule, set the `over-ride` field on the current schedule to point to the temporary one. To deactivate, clear the `over-ride` field.

### Example Schedule Document

```json
{
    "_id": "default-schedule",
    "description": "Default help/support schedule",
    "over-ride": "",
    "timezone": "America/Denver",
    "phoneNumber": "+18015551234",
    "openMessage": {
        "title": "Support Available",
        "message": "Support is currently open. Tap below to request help.",
        "requestButton": true,
        "requestButtonLabel": "Request Help",
        "dismissButtonLabel": "Dismiss"
    },
    "closedMessages": {
        "afterHours": {
            "title": "After Hours",
            "message": "Support is currently closed. Please reach out during business hours.",
            "requestButton": false,
            "dismissButtonLabel": "OK"
        },
        "weekend": {
            "title": "Weekend Closure",
            "message": "Support is closed on weekends. Please try again on the next business day.",
            "requestButton": false,
            "dismissButtonLabel": "OK"
        },
        "holiday": {
            "title": "Holiday Closure",
            "message": "Support is closed for a holiday.",
            "requestButton": false,
            "dismissButtonLabel": "OK"
        }
    },
    "closures": [
        {
            "label": "Weekday After Hours",
            "message": "afterHours",
            "days": ["mon", "tue", "wed", "thu", "fri"],
            "from": "17:00",
            "to": "23:59"
        },
        {
            "label": "Early Morning Before Open",
            "message": "afterHours",
            "days": ["mon", "tue", "wed", "thu", "fri"],
            "from": "00:00",
            "to": "08:00"
        },
        {
            "label": "Weekend",
            "message": "weekend",
            "days": ["sat", "sun"],
            "from": "00:00",
            "to": "23:59"
        }
    ]
}
```

### Field Reference

| Field                    | Type   | Description                                                                       |
| ------------------------ | ------ | --------------------------------------------------------------------------------- |
| `_id`                    | string | Document ID in CouchDB                                                            |
| `description`            | string | Human-readable description of the schedule                                        |
| `over-ride`              | string | Optional ID of another schedule to use instead (see Override Chain)               |
| `timezone`               | string | IANA timezone for time comparisons (e.g. `America/Denver`)                        |
| `phoneNumber`            | string | Phone number shown in messages (use `${phoneNumber}` placeholder in message text) |
| `openMessage`            | object | Message shown when no closure window matches                                      |
| `closedMessages`         | map    | Keyed map of messages, referenced by `closures[].message`                         |
| `closures`               | array  | Time windows that trigger a specific closed message                               |
| `closures[].days`        | array  | Day abbreviations: `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat`                |
| `closures[].from` / `to` | string | 24-hour `HH:MM` time range                                                        |

### Building Document — Per-Building Schedule

To assign a specific schedule to all rooms in a building, add the `support-schedule` field to the building document in the `buildings` database:

```json
{
    "_id": "JET",
    "name": "Jet Building",
    "description": "Example building",
    "support-schedule": "jet-schedule"
}
```

The value must match a document `_id` in the `support-schedule` database. If the referenced schedule does not exist, the system falls back to `default-schedule`.

### CouchDB Structure

```
Databases
├─theme-configuration
| ├── default
| ├── jetTheme
|
├─ui-configuration
| ├── JET-1234
| ├── BLDG-1235
|
├─support-schedule
| ├── default-schedule
| ├── jet-schedule
| ├── summer-hours
|
├─buildings
| ├── JET (with optional support-schedule field)
```
