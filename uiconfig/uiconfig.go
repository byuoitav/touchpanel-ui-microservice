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
	Api                []string             `json:"api"`
	Panels             []Panel              `json:"panels"`
	Presets            []Preset             `json:"presets"`
	InputConfiguration []InputConfiguration `json:"inputConfiguration"`
	AudioConfiguration []AudioConfiguration `json:"audioConfiguration"`
}

type Preset struct {
	Name                    string   `json:"name"`
	Icon                    string   `json:"icon"`
	Displays                []string `json:"displays"`
	ShareableDisplays       []string `json:"shareableDisplays"`
	AudioDevices            []string `json:"audioDevices"`
	Inputs                  []string `json:"inputs"`
	IndependentAudioDevices []string `json:"indpendentAudioDevices"`
}

type Panel struct {
	Hostname string   `json:"hostname"`
	UIPath   string   `json:"uipath"`
	Preset   string   `json:"preset"`
	Features []string `json:"features"`
}

type AudioConfiguration struct {
	Display      string   `json:"display"`
	AudioDevices []string `json:"audioDevices"`
	RoomWide     bool     `json:"roomWide"`
}

type InputConfiguration struct {
	Name string `json:"name"`
	Icon string `json:"icon"`
}

func getUIConfig() (UIConfig, error) {
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

	return getUIConfigFromWeb(address)
}

func getUIConfigFromWeb(address string) (UIConfig, error) {
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

	color.Set(color.FgHiGreen, color.Bold)
	log.Printf("Returning config from %s", address)
	color.Unset()

	return config, nil
}

func getUIConfigFromFile() (UIConfig, error) {
	color.Set(color.FgCyan)
	log.Printf("Getting UI Config from file: %s", UI_CONFIG_FILE)
	color.Unset()

	body, err := ioutil.ReadFile(UI_CONFIG_FILE)
	if err != nil {
		logError(fmt.Sprintf("Failed to read body from file %s: %s", UI_CONFIG_FILE, err))
		return UIConfig{}, err
	}

	var config UIConfig
	err = json.Unmarshal(body, &config)
	if err != nil {
		logError(fmt.Sprintf("Failed to unmarshal body from file %s: %s", UI_CONFIG_FILE, err))
		return UIConfig{}, err
	}

	color.Set(color.FgHiGreen, color.Bold)
	log.Printf("Returning config from file")
	color.Unset()

	return config, nil
}

func writeUIConfigToFile(config UIConfig) {
	color.Set(color.FgCyan)
	log.Printf("Writing UI Config to file: %s", UI_CONFIG_FILE)
	color.Unset()

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
