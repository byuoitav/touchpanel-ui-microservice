package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
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

func NewSubscribe(context echo.Context) error {
	return nil
}

func GetHostname(context echo.Context) error {
	hostname := os.Getenv("PI_HOSTNAME")
	return context.JSON(http.StatusOK, hostname)
}

func PublishEvent(context echo.Context) error {
	p := context.Get(eventinfrastructure.ContextPublisher)
	if typedP, ok := p.(*eventinfrastructure.Publisher); ok {
		log.Printf("I'm a publihser!")
		log.Printf("the port?? please work lol: %s", typedP.Port)
	} else {
		log.Printf("i'm not one lol")
		log.Printf("this is p %v", p)
	}
	var event eventinfrastructure.EventInfo
	err := context.Bind(&event)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	//	err = events.Publish(event, eventinfrastructure.Metrics)
	/*
		e.Hostname = os.Getenv("PI_HOSTNAME")
		if dev {
			e.Hostname = os.Getenv("DEVELOPMENT_HOSTNAME")
		}
		e.Timestamp = time.Now().Format(time.RFC3339)
		e.LocalEnvironment = len(os.Getenv("LOCAL_ENVIRONMENT")) > 0
		e.Building = Building
		e.Room = Room
		e.Event.Type = eventinfrastructure.USERACTION
		e.Event.EventCause = eventinfrastructure.USERINPUT
		if eventType == eventinfrastructure.Metrics {
			e.Event.Device = e.Hostname
		} else {
			e.Event.Device = event.Device
		}
		e.Event.EventInfoKey = event.EventInfoKey
		e.Event.EventInfoValue = event.EventInfoValue
		if len(e.Event.Device) == 0 || len(e.Event.EventInfoKey) == 0 || len(e.Event.EventInfoValue) == 0 {
			return errors.New("Please fill in all the necessary fields")
		}
	*/

	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	return context.JSON(http.StatusOK, event)
}

func PublishFeature(context echo.Context) error {
	var event eventinfrastructure.EventInfo
	err := context.Bind(&event)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	//	err = events.Publish(event, eventinfrastructure.UIFeature)
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

var configcache map[string]interface{}

func GetJSON(context echo.Context) error {
	address := os.Getenv("UI_CONFIGURATION_ADDRESS")
	hn := os.Getenv("PI_HOSTNAME")

	if len(hn) == 0 {
		return context.JSON(http.StatusInternalServerError, "PI_HOSTNAME is not set.")
	}

	if len(address) == 0 {
		if configcache != nil {
			log.Printf("[error] UI_CONFIGURATION_ADDRESS is not set. Returning cached configuration...")
			return context.JSON(http.StatusOK, configcache[hn])
		}
		return context.JSON(http.StatusInternalServerError, "UI_CONFIGURATION_ADDRESS is not set.")
	}

	log.Printf("getting json object from %s", address)
	resp, err := http.Get(address)
	if err != nil {
		if configcache != nil {
			log.Printf("[error] %s. Returning cached configuration...", err.Error())
			return context.JSON(http.StatusOK, configcache[hn])
		}
		return context.JSON(http.StatusGatewayTimeout, err.Error())
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		if configcache != nil {
			log.Printf("[error] %s. Returning cached configuration...", err.Error())
			return context.JSON(http.StatusOK, configcache[hn])
		}
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	var data map[string]interface{}
	err = json.Unmarshal(body, &data)
	if err != nil {
		if configcache != nil {
			log.Printf("[error] %s. Returning cached configuration...", err.Error())
			return context.JSON(http.StatusOK, configcache[hn])
		}
		return context.JSON(http.StatusInternalServerError, err.Error())
	} else {
		configcache = data
	}

	return context.JSON(http.StatusOK, data[hn])
}
