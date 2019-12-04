package helpers

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
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

func GetControlKey(ctx context.Context, preset string) (string, error) {
	// get the building/room
	id := os.Getenv("SYSTEM_ID")
	split := strings.Split(id, "-")
	if len(split) != 3 {
		return "", fmt.Errorf("invalid system id %q", id)
	}

	url := fmt.Sprintf("%s/%s-%s %s/getControlKey", os.Getenv("CODE_SERVICE_URL"), split[0], split[1], preset)
	log.Printf("Getting control key for preset %q from %q", preset, url)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("unable to build http request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("unable to make http request: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("unable to read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("invalid response from code service (%v): %s", resp.StatusCode, body)
	}

	var key struct {
		ControlKey string `json:"ControlKey"`
	}

	if err := json.Unmarshal(body, &key); err != nil {
		return "", fmt.Errorf("unable to unmarshal response: %w. body: %s", err, body)
	}

	return key.ControlKey, nil
}
