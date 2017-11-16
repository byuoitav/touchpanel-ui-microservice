package events

import (
	"encoding/json"
	"errors"
	"log"
	"os"
	"time"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/touchpanel-ui-microservice/socket"
	"github.com/fatih/color"
	"github.com/xuther/go-message-router/common"
)

type Message struct {
	Message string `json:"message"`
}

func WriteEventsToSocket(en *eventinfrastructure.EventNode, h *socket.Hub) {
	for {
		select {
		case message, ok := <-en.Read:
			if !ok {
				color.Set(color.FgRed)
				log.Fatalf("eventnode read channel closed.")
				color.Unset()
			}

			var e eventinfrastructure.Event
			err := json.Unmarshal(message.MessageBody, &e)
			if err != nil {
				color.Set(color.FgRed)
				log.Printf("failed to unmarshal message into Event type: %s", message.MessageBody)
				color.Unset()
			} else {
				h.WriteToSockets(e)
			}
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

func Publish(en *eventinfrastructure.EventNode, event eventinfrastructure.EventInfo, eventType string) error {
	var e eventinfrastructure.Event

	// create the event
	e.Hostname = os.Getenv("PI_HOSTNAME")
	if len(eventinfrastructure.GetDevHostname()) > 0 {
		e.Hostname = eventinfrastructure.GetDevHostname()
	}
	e.Timestamp = time.Now().Format(time.RFC3339)
	e.LocalEnvironment = len(os.Getenv("LOCAL_ENVIRONMENT")) > 0
	e.Building = eventinfrastructure.GetBuildingFromHostname()
	e.Room = eventinfrastructure.GetRoomFromHostname()
	e.Event.Type = eventinfrastructure.USERACTION
	e.Event.EventCause = eventinfrastructure.USERINPUT
	e.Event.EventInfoKey = event.EventInfoKey
	e.Event.EventInfoValue = event.EventInfoValue
	e.Event.Requestor = event.Requestor

	if eventType == eventinfrastructure.Metrics {
		e.Event.Device = e.Hostname
	} else {
		e.Event.Device = event.Device
	}

	if len(e.Event.EventInfoKey) == 0 || len(e.Event.EventInfoValue) == 0 {
		return errors.New("Please fill in all the necessary fields")
	}

	en.PublishEvent(e, eventType)
	return nil
}

func UIFilter(event common.Message) eventinfrastructure.EventInfo {
	var e eventinfrastructure.Event
	err := json.Unmarshal(event.MessageBody, &e)
	if err != nil {
		color.Set(color.FgRed)
		log.Printf("error: %v", err.Error())
		color.Unset()
		return eventinfrastructure.EventInfo{}
	}

	return e.Event
}
