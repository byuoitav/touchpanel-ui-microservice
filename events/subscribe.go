package events

import (
	"encoding/json"
	"log"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/fatih/color"
	"github.com/xuther/go-message-router/common"
)

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
