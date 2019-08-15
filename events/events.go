package events

import (
	"time"

	"github.com/byuoitav/central-event-system/messenger"
	"github.com/byuoitav/common/log"
	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/touchpanel-ui-microservice/socket"
	"github.com/fatih/color"
)

// Message is a message down a websocket
type Message struct {
	Message string `json:"message"`
}

func WriteEventsToSocket(m *messenger.Messenger) {
	for {
		event := m.ReceiveEvent()
		log.L.Debugf("received event: %#v", event)

		if events.ContainsAnyTags(event, events.CoreState, events.UICommunication, events.Error, events.RoomDivide) {
			socket.H.WriteToSockets(event)
		}
	}
}

func SendScreenTimeout() {
	socket.H.WriteToSockets(Message{Message: "screenoff"})
}

func SendRefresh(delay *time.Timer) {
	defer color.Unset()

	<-delay.C
	color.Set(color.FgYellow)
	log.L.Infof("Refreshing...")

	socket.H.WriteToSockets(Message{Message: "refresh"})
}

func SendTest() {
	defer color.Unset()

	color.Set(color.FgYellow)
	log.L.Infof("Sending event test...")

	socket.H.WriteToSockets(Message{Message: "websocketTest"})
}
