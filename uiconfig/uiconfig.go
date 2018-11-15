package uiconfig

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"

	"github.com/byuoitav/common/db"
	"github.com/byuoitav/common/structs"
	"github.com/fatih/color"
)

// UI_CONFIG_FILE is the name for the local file on the touchpanel
const UI_CONFIG_FILE = "ui-config.json"

func getUIConfig() (structs.UIConfig, error) {
	address := os.Getenv("UI_CONFIGURATION_ADDRESS")
	hn := os.Getenv("SYSTEM_ID")

	split := strings.Split(hn, "-")
	building := split[0]
	room := split[1]

	if len(hn) == 0 {
		logError("SYSTEM_ID is not set")
		return getUIConfigFromFile()
	} else if len(address) == 0 {
		logError("UI_CONFIGURATION_ADDRESS not set")
		return getUIConfigFromFile()
	}

	color.Set(color.FgYellow)
	log.Printf("Getting UI Config for %s-%s from %s", building, room, address)
	color.Unset()

	config, err := db.GetDB().GetUIConfig(fmt.Sprintf("%s-%s", building, room))
	if err != nil {
		logError(fmt.Sprintf("Failed to get UI Config for %s-%s from %s", building, room, address))
		return getUIConfigFromFile()
	}

	writeUIConfigToFile(config)

	return config, nil
}

func getUIConfigFromFile() (structs.UIConfig, error) {
	color.Set(color.FgCyan)
	log.Printf("Getting UI Config from file: %s", UI_CONFIG_FILE)
	color.Unset()

	body, err := ioutil.ReadFile(UI_CONFIG_FILE)
	if err != nil {
		logError(fmt.Sprintf("Failed to read body from file %s: %s", UI_CONFIG_FILE, err))
		return structs.UIConfig{}, err
	}

	var config structs.UIConfig
	err = json.Unmarshal(body, &config)
	if err != nil {
		logError(fmt.Sprintf("Failed to unmarshal body from file %s: %s", UI_CONFIG_FILE, err))
		return structs.UIConfig{}, err
	}

	color.Set(color.FgHiGreen, color.Bold)
	log.Printf("Returning config from file")
	color.Unset()

	return config, nil
}

func writeUIConfigToFile(config structs.UIConfig) {
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
