package events

import (
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/fatih/color"
	"github.com/xuther/go-message-router/common"
)

/*
func WriteMessagesToSocket(en *eventinfrastructure.EventNode) {
	sm := socket.NewSocketManager("", UIFilter)

	for {
		select {
		case message, ok := <-en.Read:
			if ok {
				log.Printf("message %s", message)
				sm.Write <- message
			}
			log.Fatalf("[error] subscriber read channel closed")
		}
	}
}
*/

func Refresh(en *eventinfrastructure.EventNode) {
	defer color.Unset()
	for i := 15; i > 0; i-- {
		color.Set(color.FgYellow)
		log.Printf("Refreshing webpage in %v...", i)
		color.Unset()

		time.Sleep(1 * time.Second)
	}
	en.Read <- GetRefreshMessage()

	color.Set(color.FgGreen, color.Bold)
	log.Printf("Wrote refresh message.")
}

func GetScreenTimeoutMessage() common.Message {
	var e eventinfrastructure.Event
	e.Hostname = os.Getenv("PI_HOSTNAME")
	e.Timestamp = time.Now().Format(time.RFC3339)
	e.Event.EventInfoKey = "screenoff"
	msg, err := json.Marshal(&e)
	if err != nil {
		log.Fatalf("[error] %s", err.Error())
	}

	header := [24]byte{}
	copy(header[:], []byte(eventinfrastructure.UI))

	return common.Message{MessageHeader: header, MessageBody: msg}
}

func GetRefreshMessage() common.Message {
	var e eventinfrastructure.Event
	e.Hostname = os.Getenv("PI_HOSTNAME")
	e.Timestamp = time.Now().Format(time.RFC3339)
	e.Event.EventInfoKey = "refresh"
	msg, err := json.Marshal(&e)
	if err != nil {
		log.Fatalf("[error] %s", err.Error())
	}

	header := [24]byte{}
	copy(header[:], []byte(eventinfrastructure.UI))

	return common.Message{MessageHeader: header, MessageBody: msg}
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
