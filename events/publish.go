package events

import (
	"errors"
	"os"
	"time"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
)

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
