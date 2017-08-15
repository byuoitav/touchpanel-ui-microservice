package events

import (
	"errors"
	"log"
	"os"
	"time"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/touchpanel-ui-microservice/socket"
	"github.com/fatih/color"
)

func WriteEventsToSocket(en *eventinfrastructure.EventNode, h *socket.Hub) {
	for {
		select {
		case message, ok := <-en.Read:
			if ok {
				h.WriteToSockets(message.MessageBody)
			}
			color.Set(color.FgRed)
			log.Fatalf("eventnode read channel closed.")
			color.Unset()
		}
	}
}

func SendScreenTimeout(h *socket.Hub) {
	h.WriteToSockets([]byte("screenoff"))
}

func SendRefresh(h *socket.Hub) {
	h.WriteToSockets([]byte("refresh"))
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

	if eventType == eventinfrastructure.Metrics {
		e.Event.Device = e.Hostname
	} else {
		e.Event.Device = event.Device
	}

	if len(e.Event.Device) == 0 || len(e.Event.EventInfoKey) == 0 || len(e.Event.EventInfoValue) == 0 {
		return errors.New("Please fill in all the necessary fields")
	}

	en.PublishEvent(e, eventType)
	return nil
}
