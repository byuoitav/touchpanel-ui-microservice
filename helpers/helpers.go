package helpers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os/exec"
	"strings"
)

type DeviceInfo struct {
	Hostname  string `json:"hostname"`
	IPAddress string `json:"ipaddress"`
}

type SlackHelp struct {
	Building    string       `json:"building"`
	Room        string       `json:"room"`
	Attachments []Attachment `json:"attachments"`
}

type SlackMessage struct {
	Text string `json:"text"`
}

type Attachment struct {
	Title   string   `json:"title"`
	Fields  []Field  `json:"fields"`
	Actions []Action `json:"actions"`
}

type Field struct {
	Title string `json:"title"`
	Value string `json:"value"`
	Short bool   `json:"short"`
}

type Action struct {
	Name  string `json:"name"`
	Text  string `json:"text"`
	Type  string `json:"type"`
	Value string `json:"value"`
}

type preset struct {
	roomID     string `json:"RoomID"`
	presetName string `json:"PresetName"`
}

type controlKey struct {
	ControlKey string `json:"ControlKey"`
}

func GetDeviceInfo() (DeviceInfo, error) {
	log.Printf("getting device info")
	hn, err := exec.Command("sh", "-c", "hostname").Output()
	if err != nil {
		return DeviceInfo{}, err
	}

	ip, err := exec.Command("/bin/bash", "-c", "ip addr show | grep -m 1 global | awk '{print $2}'").Output()
	if err != nil {
		return DeviceInfo{}, err
	}

	var di DeviceInfo
	di.Hostname = strings.TrimSpace(string(hn[:]))
	di.IPAddress = strings.TrimSpace(string(ip[:]))

	return di, nil
}
func GetControlKeyHelper(preset string) (string, error) {
	var resp controlKey
	url := fmt.Sprintf("control-keys.avs.byu.edu/%s/getControlKey", preset)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("An error occured while making the call: %w", err)
	}
	res, gerr := http.DefaultClient.Do(req)
	if gerr != nil {
		return "", fmt.Errorf("error when making call: %w", gerr)
	}
	defer res.Body.Close()
	body, err := ioutil.ReadAll(res.Body)
	err = json.Unmarshal([]byte(body), &resp)
	if err != nil {
		fmt.Printf("%s/n", body)
		return "", fmt.Errorf("error when unmarshalling the response: %w", err)
	}
	return resp.ControlKey, nil
}
