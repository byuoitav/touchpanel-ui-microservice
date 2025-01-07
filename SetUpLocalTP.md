# How to Create a Local Dev Environment for TouchPanel

The Touchpanel microservice runs on the raspberry pi devices and provides an interface for controlling classroom AV devices. (Projectors, Cameras, Screens, etc.) This guide shows how to set up a completely local development environment for the touchpanel microservice. At the end, we will have a functioning touchpanel that can be accessed at localhost:8888.

## CouchDB: 
Couch will hold configuration files for the touch panel's interface. The configuration files determine the theme and layout of the touch panel interface. 

#### Steps -
1. Pull the Docker Container:
```
docker pull couchdb
```
2. Run the docker container on port 5984. Save the data to /opt/couchdb/data so it persists between container restarts. Set the username and password to admin. Use the following command to do so:
```
docker run -d -p 5984:5984 --network custom-network -v couchdb_data:/opt/couchdb/data -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=admin couchdb:latest
```
3. Login to the CouchDB web interface at http://localhost:5984/_utils/index.html# with the username and password 'admin'

4. Create two databases:
    - theme-configuration
    - ui-configuration

5. theme-configuration will hold the theme files for the touch panel. There should always be a file called default that will hold the default theme. Others can be added under names like 'byu' or 'ensign'.
```
{
  "_id": "default",
  "_rev": "13-d03c97640fc85264763b1620bf0121b5",
  "background-color": "red",
  "top-bar-color": "#455a64",
  "background-color-accent": "#0091e9",
  "dpad-color": "#e3e3e3",
  "dpad-press": "#777777",
  "cam-preset-color": "#455a64",
  "cam-preset-press": "blue",
  "show-cam-text": true,
  "cam-link": "where.cameras.com",
  "phone-number": "801-422-7671",
  "volume-slider-color": "#0091ea",
  "help-button-color": "#b2dfdb",
  "text-color": "white",
  "font-link": "https://cdn.byu.edu/theme-fonts/1.x.x/ringside/fonts.css",
  "font-name": "HCo Ringside Narrow SSm"
}
```
6. Create a file containing the contents above called 'default'. Before closing the new document, click the 'Upload Attachment' button and upload any svg with the name 'logo.svg'. This will be the logo that appears in the user interface.'

7. In the ui-configuration database, create a document called 'ITB-1106'. This will hold the configuration controlling what theme is applied, what inputs, what outputs, etc. are available for the UI.

```
{
  "_id": "ITB-1106",
  "_rev": "2-fc7fb9fa93e1aca01cbbc28fbfffe09a",
  "api": [
    "localhost"
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
      "icon": "android",
      "name": "CLEVERTOUCH"
    }
  ],
  "outputConfiguration": [
    {
      "name": "D1",
      "icon": "videocam"
    },
    {
      "name": "D2",
      "icon": "videocam"
    }
  ],
  "presets": [
    {
      "name": "ITB 1106",
      "displays": [
        "D1",
        "D2"
      ],
      "icon": "videocam",
      "cameras": [
        {
          "displayName": "Camera",
          "panRight": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/move/right",
          "panLeft": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/move/left",
          "moveStop": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/move/stop",
          "restart": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/restart",
          "live": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/live",
          "tiltDown": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/move/down",
          "tiltUp": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/move/up",
          "zoomIn": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/expand/in",
          "zoomOut": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/expand/out",
          "zoomStop": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/expand/stop",
          "presets": [
            {
              "displayName": "Room",
              "savePreset": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/savePreset/0",
              "setPreset": "https://camera.camera.com/ITB-1106-CAM1.camera.com:12345/preset/0"
            }
          ]
        }
      ],
      "audioDevices": [
        "D1"
      ],
      "inputs": [
        "PC1",
        "ATV1",
        "HDMI1",
        "HDMI2"
      ],
      "independentAudioDevices": null,
      "commands": {
        "powerOn": [
          {
            "method": "PUT",
            "port": 8000,
            "endpoint": "buildings/ITB/rooms/1106",
            "body": {
              "audioDevices": [
                {}
              ]
            }
          }
        ]
      },
      "recording": {
        "start": "http://localhost:8016/192.168.0.1/ITB1101JACK1/volume/mute",
        "stop": "http://localhost:8016/192.168.0.1/ITB1101JACK1/volume/unmute",
        "maxTime": 120
      }
    }
  ],
  "panels": [
    {
      "hostname": "ITB-1106-CP1",
      "uipath": "/cherry",
      "preset": "ITB 1106",
      "features": [],
      "theme": "byu"
    }
  ],
  "audioConfiguration": []
}
```

8. At this point the configuring of the CouchDB is done and should model the following structure:
```
theme-configuration
    - default
ui-configuration
    - ITB-1106
```

## Central Event System Hub

```
docker pull ghcr.io/byuoitav/flight-deck/central-event-hub-arm:0.1.0
```

```
 docker run -d -p 7100:7100 --network custom-network ghcr.io/byuoitav/flight-deck/central-event-hub-arm:0.1.0
```

## Touchpanel Display Microservice
The touchpanel display microservice is the service that runs on the raspberry pi devices and provides the interface for controlling classroom AV devices.

1. Download the desired version of the touchpanel display microservice from the github repository. In this case v1.0.8 is used. 
```
docker pull ghcr.io/byuoitav/touchpanel-ui-microservice/touchpanel-ui-microservice:v1.0.8
```
2. Run the docker container on port 8888. Set the environment variables (DB_ADDRESS, DB_USERNAME, DB_PASSWORD, STOP_REPLICATION, SYSTEM_ID, PI_HOSTNAME, and HUB_ADDRESS) to the appropriate values. 

  The DB_ADDRESS should be the IP address of the CouchDB docker container and the HUB_ADDRESS should be the IP address of the Central Event System Hub docker container. The IP addresses can be found in the docker application (Container>the respective container>Inspect>Networks>IPAddress) or through the following commands:

  ```
  docker ps
  ``` 

  ```
  docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <container id from previous command here>
  ```

full command to run the docker container 

```
docker run -d -e "DB_ADDRESS=http://172.18.0.2:5984" -e "DB_USERNAME=admin" -e "DB_PASSWORD=admin" -e "STOP_REPLICATION=true" -e "SYSTEM_ID=ITB-1106-CP1" -e "PI_HOSTNAME=ITB-1106-CP1" -e "HUB_ADDRESS=ws://172.18.0.3:7100" --network custom-network -p 8888:8888 docker.pkg.github.com/byuoitav/touchpanel-ui-microservice/touchpanel-ui-microservice:v1.0.8 
```

## Mock State Server
The mock state server is a golang program for mocking the AV API to get the room state. Without it, the touchpanel will be stuck on the loading screen. Make a golang program with the following code in a file called main.go.

```
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, you've requested: %s\n", r.URL.Path)
	})

  mux.HandleFunc("/buildings/ITB/rooms/1106/configuration", getRoomState)
	mux.HandleFunc("/buildings/ITB/rooms/1106", getRoomState1)


  	// Use handlers.CORS() with additional options to handle preflight requests
	handler := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}), // Allow all origins
		handlers.AllowedMethods([]string{"GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "PATCH", "UPDATE"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
		handlers.AllowCredentials(),
	)(mux)

 port := 8000
	addr := fmt.Sprintf(":%d", port)

	fmt.Printf("Server listening on port %d...\n", port)
	err := http.ListenAndServe(addr, handler)
	if err != nil {
		fmt.Println("Error:", err)
	}
}

func getRoomState(w http.ResponseWriter, r *http.Request) {
	// Read the JSON file
	data := readJSONFile("roomstate.json")
	fmt.Printf("Accessing room state\n")
	// Send the JSON response
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(data))
}

func getRoomState1(w http.ResponseWriter, r *http.Request) {
	// Read the JSON file
	data := readJSONFile("roomstate1.json")
	fmt.Printf("Accessing room state 1\n")
	// Send the JSON response
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(data))
}

func readJSONFile(filename string) string {
	file, err := os.Open(filename)
	if err != nil {
		log.Println(err)
		return ""
	}
	defer file.Close()

	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		log.Println(err)
		return ""
	}

	return string(bytes)
}
```
```
go mod init 
```
```
go mod tidy
```
```
go get github.com/gorilla/handlers
```

Paste the following into a file in the same directory called roomstate.json
```
{"_id":"ITB-1106","name":"1106","description":"Testing for the scheduling panel outside","configuration":{"_id":"Tiered Switch DSP","evaluators":[{"_id":"PowerOnDefault","codekey":"PowerOnDefault","description":"PowerOnDefault","priority":1},{"_id":"StandbyDefault","codekey":"StandbyDefault","description":"StandbyDefault","priority":9999},{"_id":"MuteDSP","codekey":"MuteDSP","description":"MuteDSP","priority":5555},{"_id":"UnmuteDSP","codekey":"UnmuteDSP","description":"UnmuteDSP","priority":5555},{"_id":"UnBlankDisplayDefault","codekey":"UnBlankDisplayDefault","description":"UnBlankDisplayDefault","priority":5555},{"_id":"BlankDisplayDefault","codekey":"BlankDisplayDefault","description":"BlankDisplayDefault","priority":5555},{"_id":"SetVolumeDSP","codekey":"SetVolumeDSP","description":"SetVolumeDSP","priority":5555},{"_id":"STATUS_BlankedDefault","codekey":"STATUS_BlankedDefault","description":"STATUS_BlankedDefault","priority":5555},{"_id":"STATUS_PowerDefault","codekey":"STATUS_PowerDefault","description":"STATUS_PowerDefault","priority":5555},{"_id":"STATUS_Tiered_Switching","codekey":"STATUS_Tiered_Switching","description":"STATUS_Tiered_Switching","priority":5555},{"_id":"STATUS_MutedDSP","codekey":"STATUS_MutedDSP","description":"STATUS_MutedDSP","priority":5555},{"_id":"STATUS_VolumeDSP","codekey":"STATUS_VolumeDSP","description":"STATUS_VolumeDSP","priority":5555},{"_id":"ChangeVideoInputTieredSwitcher","codekey":"ChangeVideoInputTieredSwitcher","description":"ChangeVideoInputTieredSwitcher","priority":5555}],"description":"Default"},"designation":"production","devices":[{"_id":"ITB-1106-ATV1","name":"ATV1","address":"ITB1106.camera.com","description":"","display_name":"Screen Share","type":{"_id":"non-controllable","description":"A Non-controllable Device","display_name":"HDMI","input":true,"source":true,"roles":[{"_id":"AudioIn","description":"Acts as an audio input device"},{"_id":"VideoIn","description":"Acts as a video input device"}]},"roles":[{"_id":"AudioIn","description":"Acts as an audio input device"},{"_id":"VideoIn","description":"Acts as a video input device"}],"ports":[]},{"_id":"ITB-1106-CAM1","name":"CAM1","address":"ITB-1106-CAM1.camera.com","description":"","display_name":"","type":{"_id":"AVER 520 Pro Camera","description":"AVER 520 Pro Camera","display_name":"CAM","input":true,"source":true,"roles":[{"_id":"VideoIn","description":"Acts as a video input device"}]},"roles":[],"ports":null},{"_id":"ITB-1106-CP1","name":"CP1","address":"ITB-1106-CP1.camera.com","description":"","display_name":"","type":{"_id":"Pi3","description":"A Raspberry Pi 3","display_name":"Pi","roles":[{"_id":"ControlProcessor","description":"Acts as a device to control the AV-API in a room"},{"_id":"Touchpanel","description":"A device with a touchscreen interface"},{"_id":"EventRouter","description":"Acts as a device that routes events through the room to other devices"}],"commands":[{"_id":"GenericPassthroughADCP","description":"GenericPassthroughADCP","microservice":{"_id":"generic-gateway-Adcp","description":"used to serialize requests to and ADCP device","address":"http://:gateway:8012"},"endpoint":{"_id":"Generic Gateway","description":"A generic Gateway for use in base case where microservice exists outside of the pi issuing the requests. ","path":"/:path"},"priority":1}]},"roles":[{"_id":"ControlProcessor","description":"ControlProcessor"},{"_id":"Touchpanel","description":"Touchpanel"},{"_id":"EventRouter","description":"EventRouter"}],"ports":[]},{"_id":"ITB-1106-CP2","name":"CP2","address":"ITB-1106-CP2.camera.com","description":"","display_name":"","type":{"_id":"Pi3","description":"A Raspberry Pi 3","display_name":"Pi","roles":[{"_id":"ControlProcessor","description":"Acts as a device to control the AV-API in a room"},{"_id":"Touchpanel","description":"A device with a touchscreen interface"},{"_id":"EventRouter","description":"Acts as a device that routes events through the room to other devices"}],"commands":[{"_id":"GenericPassthroughADCP","description":"GenericPassthroughADCP","microservice":{"_id":"generic-gateway-Adcp","description":"used to serialize requests to and ADCP device","address":"http://:gateway:8012"},"endpoint":{"_id":"Generic Gateway","description":"A generic Gateway for use in base case where microservice exists outside of the pi issuing the requests. ","path":"/:path"},"priority":1}]},"roles":[{"_id":"ControlProcessor","description":"ControlProcessor"},{"_id":"Touchpanel","description":"Touchpanel"},{"_id":"EventRouter","description":"EventRouter"}],"ports":[]},{"_id":"ITB-1106-D1","name":"D1","address":"ITB-1106-D1.camera.com","description":"Projector","display_name":"Projector","type":{"_id":"Sony Projector No Audio","description":"Sony projector","display_name":"Sony projector with no audio","output":true,"destination":true,"roles":[{"_id":"VideoOut","description":"Acts as a video output device"},{"_id":"Microphone","description":"so that audio gets routed through the dsp"}],"ports":[{"_id":"hdmi1","friendly_name":"hdmi port 1","description":"hdmi port 1","tags":["in","video"]},{"_id":"hdbaset1","friendly_name":"HDBaseT port 1","description":"HDBaseT port 1","tags":["in","video"]},{"_id":"dvi1","friendly_name":"DVI port 1","description":"DVI port 1","tags":["in","video"]}],"power_states":[{"_id":"On","description":"On"},{"_id":"Standby","description":"Standby"}],"commands":[{"_id":"PowerOn","description":"PowerOn","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"PowerOn","description":"Standard PowerOn endpoint.","path":"/:address/power/on"},"priority":1},{"_id":"Standby","description":"Standby","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"Standby","description":"Standard standby endpoint.","path":"/:address/power/standby"},"priority":100},{"_id":"ChangeInput","description":"ChangeInput","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"ChangeInput","description":"Standard ChangeInput endpoint.","path":"/:address/input/:port"},"priority":10},{"_id":"BlankDisplay","description":"BlankDisplay","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"BlankScreen","description":"Standard BlankScreen endpoint.","path":"/:address/blanked/blank"},"priority":10},{"_id":"UnblankDisplay","description":"UnblankDisplay","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"UnblankScreen","description":"Standard UnblankScreen endpoint.","path":"/:address/blanked/unblank"},"priority":7},{"_id":"STATUS_Power","description":"STATUS_Power","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"StatusPower","description":"Standard power state endpoint","path":"/:address/power"},"priority":20},{"_id":"STATUS_Input","description":"STATUS_Input","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"StatusInput","description":"returns current input state for devices with a single input","path":"/:address/input"},"priority":20},{"_id":"STATUS_Blanked","description":"STATUS_Blanked","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"StatusBlank","description":"Standard display status endpoint","path":"/:address/blanked"},"priority":20},{"_id":"HardwareInfo","description":"HardwareInfo","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"HardwareInfo","description":"Hardware information endpoint","path":"/:address/hardware"},"priority":20},{"_id":"HealthCheck","description":"HealthCheck","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"HealthCheck","description":"Hits the hardware endpoint because if we can, we *should* be able to talk with it..","path":"/:address/power"},"priority":20},{"_id":"ActiveSignal","description":"ActiveSignal","microservice":{"_id":"adcp-control-microservice","description":"Used to control ADCP enabled devices (Sony Laser Projector)","address":"http://localhost:8012"},"endpoint":{"_id":"ActiveSignal","description":"Active signal endpoint","path":"/:address/activesignal"},"priority":20}],"default-name":"D","default-icon":"videocam","tags":["projector","display"]},"roles":[{"_id":"AudioOut","description":"AudioOut"},{"_id":"VideoOut","description":"VideoOut"},{"_id":"Microphone","description":"VideoOut"},{"_id":"MirrorMaster","description":"The master of the slaves"}],"ports":[{"_id":"hdbaset1","friendly_name":"HDBaseT","source_device":"ITB-1106-SW1","destination_device":"ITB-1106-D1","description":"HDBaseT port 1","tags":["port-in","video"]},{"_id":"mirror","destination_device":"ITB-1106-D2"}],"proxy":{".*":"ITB-1106-CP1.camera.com"}},{"_id":"ITB-1106-D2","name":"D2","address":"ITB-1106-D2.camera.com","description":"Flatpanel","display_name":"Flatpanel","type":{"_id":"Sony XBR No Audio (Mirror)","description":"The Sony XBR TV line sans audio","display_name":"Sony XBR","output":true,"destination":true,"roles":[{"_id":"VideoOut","description":"Acts as a video output device"},{"_id":"AudioOut","description":"Acts as a video output device"},{"_id":"Microphone","description":"so that audio gets routed through the dsp"}],"ports":[{"_id":"hdmi!1","friendly_name":"SonyTV HDMI input 1","description":"SonyTV HDMI input 1"},{"_id":"hdmi!2","friendly_name":"SonyTv HDMI input 2","description":"SonyTv HDMI input 2"},{"_id":"hdmi!3","friendly_name":"Sony TV HDMI Input 3","description":"Sony TV HDMI Input 3"},{"_id":"hdmi!4","friendly_name":"SonyTV HDMI Input 4","description":"SonyTV HDMI Input 4"}],"power_states":[{"_id":"On","description":"On"},{"_id":"Standby","description":"Standby"}],"commands":[{"_id":"Standby","description":"Standby","microservice":{"_id":"sony-control-microservice","description":"","address":"http://localhost:8007"},"endpoint":{"_id":"Standby","description":"Standard standby endpoint.","path":"/:address/power/standby"},"priority":100},{"_id":"PowerOn","description":"PowerOn","microservice":{"_id":"sony-control-microservice","description":"","address":"http://localhost:8007"},"endpoint":{"_id":"PowerOn","description":"Standard PowerOn endpoint.","path":"/:address/power/on"},"priority":1},{"_id":"ChangeInput","description":"ChangeInput","microservice":{"_id":"sony-control-microservice","description":"","address":"http://localhost:8007"},"endpoint":{"_id":"ChangeInput","description":"Standard ChangeInput endpoint.","path":"/:address/input/:port"},"priority":10},{"_id":"BlankDisplay","description":"BlankDisplay","microservice":{"_id":"sony-control-microservice","description":"","address":"http://localhost:8007"},"endpoint":{"_id":"BlankScreen","description":"Standard BlankScreen endpoint.","path":"/:address/display/blank"},"priority":10},{"_id":"UnblankDisplay","description":"UnblankDisplay","microservice":{"_id":"sony-control-microservice","description":"","address":"http://localhost:8007"},"endpoint":{"_id":"UnblankScreen","description":"Standard UnblankScreen endpoint.","path":"/:address/display/unblank"},"priority":7},{"_id":"HardwareInfo","description":"HardwareInfo","microservice":{"_id":"sony-control-microservice","description":"","address":"http://localhost:8007"},"endpoint":{"_id":"HardwareInfo","description":"Hardware information endpoint","path":"/:address/hardware"},"priority":20},{"_id":"ActiveSignal","description":"ActiveSignal","microservice":{"_id":"sony-control-microservice","description":"","address":"http://localhost:8007"},"endpoint":{"_id":"ActiveSignal","description":"Active signal endpoint","path":"/:address/active/:port"},"priority":20},{"_id":"HealthCheck","description":"HealthCheck","microservice":{"_id":"sony-control-microservice","description":"Used to control the Sony things","address":"http://localhost:8007"},"endpoint":{"_id":"HealthCheck","description":"Hits the get input endpoint because if we can, we *should* be able to talk with it..","path":"/:address/power/status"},"priority":20}],"default-name":"D","default-icon":"tv"},"roles":[{"_id":"VideoOut","description":"VideoOut"},{"_id":"AudioOut","description":"Acts as an audio output device"}],"ports":[{"_id":"hdmi!1","source_device":"ITB-1106-SW1","destination_device":"ITB-1106-D2"}],"proxy":{".*":"ITB-1106-CP1.camera.com"}},{"_id":"ITB-1106-HDMI1","name":"HDMI1","address":"192.168.0.1","description":"HDMI","display_name":"Rack HDMI","type":{"_id":"non-controllable","description":"A Non-controllable Device","display_name":"HDMI","input":true,"source":true,"roles":[{"_id":"AudioIn","description":"Acts as an audio input device"},{"_id":"VideoIn","description":"Acts as a video input device"}]},"roles":[{"_id":"AudioIn","description":"AudioIn"},{"_id":"VideoIn","description":"VideoIn"}],"ports":[]},{"_id":"ITB-1106-PC1","name":"PC1","address":"192.168.0.1","description":"Computer","display_name":"PC1","type":{"_id":"non-controllable","description":"A Non-controllable Device","display_name":"HDMI","input":true,"source":true,"roles":[{"_id":"AudioIn","description":"Acts as an audio input device"},{"_id":"VideoIn","description":"Acts as a video input device"}]},"roles":[{"_id":"AudioIn","description":"AudioIn"},{"_id":"VideoIn","description":"VideoIn"}],"ports":[]},{"_id":"ITB-1106-SP1","name":"SP1","address":"ITB-1106-SP1.camera.com","description":"Scheduling Panel","display_name":"Scheduling Panel","type":{"_id":"Scheduler","description":"A scheduling panel","display_name":"Scheduling Panel","roles":[{"_id":"Scheduler","description":"Acts as a device that schedules meetings and displays room schedules"}]},"roles":[{"_id":"Touchpanel","description":"Touchpanel"},{"_id":"EventRouter","description":"Acts as a device that routes events through the room to other devices"}],"ports":[]},{"_id":"ITB-1106-SW1","name":"SW1","address":"ITB-1106-SW1.camera.com","description":"","display_name":"Switcher","type":{"_id":"ATLONA-5X2-CONTROL","description":"Atlona 5x1 Video Switcher using telnet control","display_name":"Atlona Video Switcher - both new and old 5x1 switchers","source":true,"destination":true,"roles":[{"_id":"VideoSwitcher","description":"Acts as a device that routes video and audio signals"},{"_id":"DSP","description":"audio stuff"}],"ports":[{"_id":"IN1","friendly_name":"In 1","description":"In 1 on physical device"},{"_id":"IN2","friendly_name":"In 2","description":"In 2 on physical device"},{"_id":"IN3","friendly_name":"In 3","description":"In 3 on physical device"},{"_id":"IN4","friendly_name":"In 4","description":"In 4 on physical device"},{"_id":"IN5","friendly_name":"In 5","description":"In 5 on physical device"},{"_id":"OUT1","friendly_name":"Out 1","description":"Out 1 on physical device"},{"_id":"AUDIOOut1","friendly_name":"Audio 1","description":"Audio 1 on physical device"}],"commands":[{"_id":"ChangeInput","description":"ChangeInput","microservice":{"_id":"atlona-switch-microservice","description":"Used to Control the Atlona video switcher","address":"http://localhost:8041"},"endpoint":{"_id":"ChangeInputVideoSwitch","description":"change input matrix endpoint","path":"/api/v1/AT-UHD-SW-52ED/:address/output/:output/input/:input"},"priority":10},{"_id":"STATUS_Input","description":"STATUS_Input","microservice":{"_id":"atlona-switch-microservice","description":"Used to Control the Atlona video switcher","address":"http://localhost:8041"},"endpoint":{"_id":"StatusInputByPort","description":"Gets the input by output port","path":"/api/v1/AT-UHD-SW-52ED/:address/output/:port/input/"},"priority":20},{"_id":"SetVolume","description":"SetVolume","microservice":{"_id":"atlona-switch-microservice","description":"Used to Control the Atlona video switcher","address":"http://localhost:8041"},"endpoint":{"_id":"SetVolumeDSP","description":"Sets the volume of the specified port","path":"/api/v1/AT-UHD-SW-52ED/:address/block/:input/volume/:level"},"priority":10},{"_id":"Mute","description":"Mute","microservice":{"_id":"atlona-switch-microservice","description":"Used to Control the Atlona video switcher","address":"http://localhost:8041"},"endpoint":{"_id":"MuteDSP","description":"Mutes the specified port","path":"/api/v1/AT-UHD-SW-52ED/:address/block/:input/muted/true"},"priority":10},{"_id":"UnMute","description":"UnMute","microservice":{"_id":"atlona-switch-microservice","description":"Used to Control the Atlona video switcher","address":"http://localhost:8041"},"endpoint":{"_id":"UnMuteDSP","description":"Unmutes the specified port","path":"/api/v1/AT-UHD-SW-52ED/:address/block/:input/muted/false"},"priority":10},{"_id":"STATUS_VolumeDSP","description":"STATUS_VolumeDSP","microservice":{"_id":"atlona-switch-microservice","description":"Used to Control the Atlona video switcher","address":"http://localhost:8041"},"endpoint":{"_id":"StatusVolumeDSP","description":"Returns the volume of the specified input (mic, etc...)","path":"/api/v1/AT-UHD-SW-52ED/:address/block/:input/volume"},"priority":20},{"_id":"STATUS_MutedDSP","description":"STATUS_MutedDSP","microservice":{"_id":"atlona-switch-microservice","description":"Used to Control the Atlona video switcher","address":"http://localhost:8041"},"endpoint":{"_id":"StatusMuteDSP","description":"Returns the mute status of the specified input (mic, etc...)","path":"/api/v1/AT-UHD-SW-52ED/:address/block/:input/muted"},"priority":20},{"_id":"HealthCheck","description":"HealthCheck","microservice":{"_id":"atlona-switcher-microservice","description":"Used to control Atlona switchers","address":"http://localhost:8041"},"endpoint":{"_id":"HealthCheck","description":"","path":"/api/v1/AT-UHD-SW-52ED/:address/output/hdmiOutA/input/"},"priority":20}],"tags":["video-switcher"]},"roles":[{"_id":"VideoSwitcher","description":"Acts as a device that routes video and audio signals"},{"_id":"DSP","description":"DSP"}],"ports":[{"_id":"IN1","friendly_name":"In 1","source_device":"ITB-1106-HDMI1","destination_device":"ITB-1106-SW1","description":"In 1 on physical device"},{"_id":"IN2","friendly_name":"In 2","source_device":"ITB-1106-ATV1","destination_device":"ITB-1106-SW1","description":"In 2 on physical device"},{"_id":"IN3","friendly_name":"In 3","source_device":"ITB-1106-PC1","destination_device":"ITB-1106-SW1","description":"In 3 on physical device"},{"_id":"IN4","friendly_name":"In 4","destination_device":"ITB-1106-SW1","description":"In 4 on physical device"},{"_id":"OUT1","friendly_name":"Out 0","source_device":"ITB-1106-SW1","destination_device":"ITB-1106-D1","description":"Out 0 on physical device"},{"_id":"OUT1","friendly_name":"Out 0","source_device":"ITB-1106-SW1","destination_device":"ITB-1106-D2","description":"Out 0 on physical device"},{"_id":"AUDIOOut1","friendly_name":"Audio 1","source_device":"ITB-1106-D1","destination_device":"ITB-1106-SW1","description":"Audio 1 on physical device"}]},{"_id":"ITB-1106-TEST1","name":"TEST1","address":"192.168.0.1","description":"HDMI","display_name":"TEST1","type":{"_id":"non-controllable","description":"A Non-controllable Device","display_name":"HDMI","input":true,"source":true,"roles":[{"_id":"AudioIn","description":"Acts as an audio input device"},{"_id":"VideoIn","description":"Acts as a video input device"}]},"roles":[{"_id":"AudioIn","description":"AudioIn"},{"_id":"VideoIn","description":"VideoIn"}],"ports":[]},{"_id":"ITB-1106-TEST2","name":"TEST2","address":"192.168.0.1","description":"HDMI","display_name":"TEST2","type":{"_id":"non-controllable","description":"A Non-controllable Device","display_name":"HDMI","input":true,"source":true,"roles":[{"_id":"AudioIn","description":"Acts as an audio input device"},{"_id":"VideoIn","description":"Acts as a video input device"}]},"roles":[{"_id":"AudioIn","description":"AudioIn"},{"_id":"VideoIn","description":"VideoIn"}],"ports":[]}],"input_reachability":{"ATV1":["D1","D2","D2"],"HDMI1":["D1","D2","D2"],"PC1":["D1","D2","D2"]}}

```

Paste the following into a file in the same directory called roomstate1.json
```
{"displays":[{"name":"D1","power":"on","input":"HDMI1","blanked":false}],"audioDevices":[{"name":"D1","power":"on","input":"HDMI1","muted":false,"volume":30}]}
```

Run `go run main.go` in the terminal to start the mock state server.

##

At this point, navigating to `localhost:8888` in the browser should bring up a functioning touchpanel display. You can set the display size in developer mode to 800x480 to be the same as the raspberry pi displays.