package handlers

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/event-router-microservice/subscription"
	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/byuoitav/touchpanel-ui-microservice/helpers"
	"github.com/labstack/echo"
)

func OpenWebSocket(context echo.Context) error {
	events.StartWebClient(context.Response(), context.Request())
	return nil
}

func Subscribe(context echo.Context) error {
	var sr subscription.SubscribeRequest
	err := context.Bind(&sr)
	if err != nil {
		log.Printf("[error] %s", err.Error())
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	log.Printf("[handler] Subscribing to %s", sr.Address)
	err = events.Sub.Subscribe(sr.Address, []string{eventinfrastructure.UI})
	if err != nil {
		log.Printf("[error] %s", err.Error())
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	return context.JSON(http.StatusOK, context)
}

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

	err = events.Publish(event)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
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

func Refresh(context echo.Context) error {
	log.Printf("[management] Refreshing webpage")
	events.Refresh()

	return nil
}

func Reboot(context echo.Context) error {
	log.Printf("[management] Rebooting pi")
	http.Get("http://localhost:7010/reboot")
	return nil
}

func GetDockerStatus(context echo.Context) error {
	log.Printf("[management] Getting docker status")
	resp, err := http.Get("http://localhost:7010/dockerStatus")
	log.Printf("docker status response: %s", resp)
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

	log.Printf("sh: %s", sh)
	json, err := json.Marshal(sh)
	if err != nil {
		log.Printf("failed to marshal sh: %s", sh)
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	log.Printf("body: %s", json)
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
