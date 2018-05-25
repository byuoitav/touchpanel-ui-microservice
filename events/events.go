package events

import (
	"encoding/json"
	"errors"
	"log"
	"os"
	"time"

	"github.com/byuoitav/common/events"
	"github.com/byuoitav/touchpanel-ui-microservice/socket"
	"github.com/fatih/color"
	"github.com/xuther/go-message-router/common"
)

type Message struct {
	Message string `json:"message"`
}

func WriteEventsToSocket(en *events.EventNode, h *socket.Hub) {
	for {
		var e events.Event
		e, err := en.Read()
		if err != nil {
			color.Set(color.FgRed)
			log.Printf("failed to read into Event type: %s", err.Error())
			color.Unset()
		} else {
			h.WriteToSockets(e)
		}
	}
}

func SendScreenTimeout(h *socket.Hub) {
	h.WriteToSockets(Message{Message: "screenoff"})
}

func SendRefresh(h *socket.Hub, delay *time.Timer) {
	defer color.Unset()

	<-delay.C
	color.Set(color.FgYellow)
	log.Printf("Refreshing...")

	h.WriteToSockets(Message{Message: "refresh"})
}

func SendTest(h *socket.Hub) {
	defer color.Unset()

	color.Set(color.FgYellow)
	log.Printf("Sending event test...")

	h.WriteToSockets(Message{Message: "websocketTest"})
}

func Publish(en *events.EventNode, event events.EventInfo, eventType string) error {
	var e events.Event

	// create the event
	e.Hostname = os.Getenv("PI_HOSTNAME")
	if len(events.GetDevHostname()) > 0 {
		e.Hostname = events.GetDevHostname()
	}
	e.Timestamp = time.Now().Format(time.RFC3339)
	e.LocalEnvironment = len(os.Getenv("LOCAL_ENVIRONMENT")) > 0
	e.Building = events.GetBuildingFromHostname()
	e.Room = events.GetRoomFromHostname()
	e.Event.Type = events.USERACTION
	e.Event.EventCause = events.USERINPUT
	e.Event.EventInfoKey = event.EventInfoKey
	e.Event.EventInfoValue = event.EventInfoValue
	e.Event.Requestor = event.Requestor

	if eventType == events.Metrics {
		e.Event.Device = e.Hostname
	} else {
		e.Event.Device = event.Device
	}

	if len(e.Event.EventInfoKey) == 0 || len(e.Event.EventInfoValue) == 0 {
		return errors.New("Please fill in all the necessary fields")
	}

	en.PublishEvent(eventType, e)
	return nil
}

func UIFilter(event common.Message) events.EventInfo {
	var e events.Event
	err := json.Unmarshal(event.MessageBody, &e)
	if err != nil {
		color.Set(color.FgRed)
		log.Printf("error: %v", err.Error())
		color.Unset()
		return events.EventInfo{}
	}

	return e.Event
}
