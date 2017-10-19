package uiconfig

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/fatih/color"
)

const UI_CONFIG_FILE = "ui-config.json"

type UIConfig struct {
	Presets []Preset `json:"presets"`
	Panels  []Panel  `json:"panels"`
}

type Preset struct {
	Name         string   `json:"name"`
	Icon         string   `json:"icon"`
	Displays     []string `json:"displays"`
	AudioDevices []string `json:"audioDevices"`
	Inputs       []string `json:"inputs"`
}

type Panel struct {
	Hostname         string   `json:"hostname"`
	UIPath           string   `json:"uipath"`
	Presets          []string `json:"presets"`
	Features         []string `json:"features"`
	IndependentAudio []string `json:"inputs"`
}

func GetUIConfig() (UIConfig, error) {
	address := os.Getenv("UI_CONFIGURATION_ADDRESS")
	hn := os.Getenv("PI_HOSTNAME")

	split := strings.Split(hn, "-")
	building := split[0]
	room := split[1]

	if len(hn) == 0 {
		logError("PI_HOSTNAME is not set")
		return getUIConfigFromFile()
	} else if len(address) == 0 {
		logError("UI_CONFIGURATION_ADDRESS not set")
		return getUIConfigFromFile()
	}

	address = strings.Replace(address, "BUILDING", building, 1)
	address = strings.Replace(address, "ROOM", room, 1)

	color.Set(color.FgYellow)
	log.Printf("Getting UI Config for %s-%s from %s", building, room, address)
	color.Unset()

	return getUIConfig(address)
}

func getUIConfig(address string) (UIConfig, error) {
	resp, err := http.Get(address)
	if err != nil {
		logError(fmt.Sprintf("Failed to make GET request to %s: %s", address, err))
		return getUIConfigFromFile()
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logError(fmt.Sprintf("Failed to read body from %s: %s", address, err))
		return getUIConfigFromFile()
	}

	var config UIConfig
	err = json.Unmarshal(body, &config)
	if err != nil {
		logError(fmt.Sprintf("Failed to unmarshal body from %s: %s", address, err))
		return getUIConfigFromFile()
	}

	writeUIConfigToFile(config)
	return config, nil
}

func getUIConfigFromFile() (UIConfig, error) {
	return UIConfig{}, nil
}

func writeUIConfigToFile(config UIConfig) {
	f, err := os.Create(UI_CONFIG_FILE)
	if err != nil {
		logError(fmt.Sprintf("Failed create file %s: %s", UI_CONFIG_FILE, err))
		return
	}

	bytes, err := json.Marshal(config)
	if err != nil {
		logError(fmt.Sprintf("Failed to marshal config: %s", err))
		return
	}

	f.Write(bytes)
	f.Sync()
}

func logError(err string) {
	color.Set(color.FgRed)
	log.Printf("%s", err)
	color.Unset()
}
