package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/byuoitav/touchpanel-ui-microservice/helpers"
	"github.com/labstack/echo"
)

func GetHostname(context echo.Context) error {
	hostname := os.Getenv("PI_HOSTNAME")
	return context.JSON(http.StatusOK, hostname)
}

func PublishEvent(context echo.Context) error {
	var event eventinfrastructure.EventInfo
	err := context.Bind(&event)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	e := context.Get(eventinfrastructure.ContextEventNode)
	if en, ok := e.(*eventinfrastructure.EventNode); ok {
		events.Publish(en, event, eventinfrastructure.Metrics)
	} else {
		return context.JSON(http.StatusInternalServerError, errors.New("Middleware failed to set the publisher"))
	}

	return context.JSON(http.StatusOK, event)
}

func PublishFeature(context echo.Context) error {
	var event eventinfrastructure.EventInfo
	err := context.Bind(&event)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	e := context.Get(eventinfrastructure.ContextEventNode)
	if en, ok := e.(*eventinfrastructure.EventNode); ok {
		events.Publish(en, event, eventinfrastructure.UIFeature)
	} else {
		return context.JSON(http.StatusInternalServerError, errors.New("Middleware failed to set the publisher"))
	}

	return context.JSON(http.StatusOK, event)
}

func GetDeviceInfo(context echo.Context) error {
	di, err := helpers.GetDeviceInfo()
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	return context.JSON(http.StatusOK, di)
}

func Reboot(context echo.Context) error {
	log.Printf("[management] Rebooting pi")
	http.Get("http://localhost:7010/reboot")
	return nil
}

func GetDockerStatus(context echo.Context) error {
	log.Printf("[management] Getting docker status")
	resp, err := http.Get("http://localhost:7010/dockerStatus")
	log.Printf("docker status response: %v", resp)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	return context.String(http.StatusOK, string(body))
}

func Help(context echo.Context) error {
	var sh helpers.SlackHelp
	err := context.Bind(&sh)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	log.Printf("Requesting help in building %s, room %s", sh.Building, sh.Room)
	url := os.Getenv("HELP_SLACKBOT_WEBHOOK")
	if len(url) == 0 {
		panic(fmt.Sprintf("HELP_SLACKBOT_WEBHOOK is not set."))
	}

	// build json payload
	// attachment
	var attachment helpers.Attachment
	attachment.Title = "help request"
	// fields
	var fieldOne helpers.Field
	var fieldTwo helpers.Field
	fieldOne.Title = "building"
	fieldOne.Value = sh.Building
	fieldOne.Short = true
	fieldTwo.Title = "room"
	fieldTwo.Value = sh.Room
	fieldTwo.Short = true
	// actions
	var actionOne helpers.Action
	actionOne.Name = "accepthelp"
	actionOne.Text = "help"
	actionOne.Type = "button"
	actionOne.Value = "true"
	// put into sh
	attachment.Fields = append(attachment.Fields, fieldOne)
	attachment.Fields = append(attachment.Fields, fieldTwo)
	attachment.Actions = append(attachment.Actions, actionOne)
	sh.Attachments = append(sh.Attachments, attachment)

	json, err := json.Marshal(sh)
	if err != nil {
		log.Printf("failed to marshal sh: %v", sh)
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(json))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	return context.JSON(http.StatusOK, string(body))
}

func ConfirmHelp(context echo.Context) error {
	var sh helpers.SlackHelp
	err := context.Bind(&sh)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	log.Printf("Confirming help in building %s, room %s", sh.Building, sh.Room)
	url := os.Getenv("HELP_SLACKBOT_WEBHOOK")
	if len(url) == 0 {
		panic(fmt.Sprintf("HELP_SLACKBOT_WEBHOOK is not set."))
	}

	var shm helpers.SlackMessage

	shm.Text = fmt.Sprintf("Confirmation of request for help in building %s and room %s", sh.Building, sh.Room)
	json, err := json.Marshal(shm)
	if err != nil {
		log.Printf("failed to marshal shm: %s", shm)
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(json))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	return context.JSON(http.StatusOK, string(body))
}

func CancelHelp(context echo.Context) error {
	var sh helpers.SlackHelp
	err := context.Bind(&sh)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	log.Printf("Canceling request for help %s, room %s", sh.Building, sh.Room)
	url := os.Getenv("HELP_SLACKBOT_WEBHOOK")
	if len(url) == 0 {
		panic(fmt.Sprintf("HELP_SLACKBOT_WEBHOOK is not set."))
	}

	var shm helpers.SlackMessage

	shm.Text = fmt.Sprintf("Cancellation of request for help in building %s and room %s", sh.Building, sh.Room)
	json, err := json.Marshal(shm)
	if err != nil {
		log.Printf("failed to marshal shm: %s", shm)
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(json))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	return context.JSON(http.StatusOK, string(body))

}

func GetJSON(context echo.Context) error {
	j, err := Getjson()
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	return context.JSON(http.StatusOK, j)
}

var configcache map[string]interface{}

func Getjson() (j map[string]interface{}, e error) {
	address := os.Getenv("UI_CONFIGURATION_ADDRESS")
	hn := os.Getenv("PI_HOSTNAME")
	split := strings.Split(hn, "-")
	building := split[0]
	room := split[1]

	log.Printf("Getting the config file for %s-%s", building, room)

	if len(hn) == 0 {
		log.Printf("[error] PI_HOSTNAME is not set.")
		e = errors.New("PI_HOSTNAME is not set")
		return
	}

	if len(address) == 0 {
		if configcache != nil {
			log.Printf("[error] UI_CONFIGURATION_ADDRESS is not set. Returning cached configuration...")
			j = configcache
			return
		}
		e = errors.New("UI_CONFIGURATION_ADDRESS is not set")
		return
	}

	address = strings.Replace(address, "BUILDING", building, 1)
	address = strings.Replace(address, "ROOM", room, 1)
	log.Printf("getting json object from %s", address)

	resp, err := http.Get(address)
	if err != nil {
		if configcache != nil {
			log.Printf("[error] %s. Returning cached configuration...", err.Error())
			j = configcache
		}
		log.Printf("[error] %s. No cache to serve. Cannot continue.", err.Error())
		e = err
		return
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		if configcache != nil {
			log.Printf("[error] %s. Returning cached configuration...", err.Error())
			j = configcache
			return
		}
		log.Printf("[error] %s. Could not read response body and there is no cache.", err.Error())
		e = err
		return
	}

	var data map[string]interface{}
	ret := make(map[string]interface{})
	err = json.Unmarshal(body, &data)
	if err != nil {
		if configcache != nil {
			log.Printf("[error] %s. Returning cached configuration...", err.Error())
			j = configcache
			return
		}
		log.Printf("[error] %s. Error unmarshalling the body, and there is no cache.", err.Error())
		e = err
		return
	} else {
		var tmp map[string]interface{}
		bytes, _ := json.Marshal(data[hn])
		json.Unmarshal(bytes, &tmp)

		ret["ui"] = tmp["ui"]
		ret["audio"] = tmp["audio"]
		ret["displays"] = tmp["displays"]
		ret["features"] = tmp["features"]
		ret["inputdevices"] = tmp["inputdevices"]
		ret["apiconfig"] = data["apiconfig"]

		configcache = ret
	}

	log.Printf("Done.")

	j = ret
	return
}
