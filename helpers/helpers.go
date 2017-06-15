package helpers

import (
	"log"
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
