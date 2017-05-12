package events

import (
	"encoding/json"
	"log"
	"os"
	"strings"
	"time"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/xuther/go-message-router/common"
	"github.com/xuther/go-message-router/publisher"
)

var Publisher publisher.Publisher
var Building string
var Room string
var Name string

func Init() {
	getBuildingAndRoomAndName()
	Publisher, err := publisher.NewPublisher("7003", 1000, 10)
	log.Printf("hi2")
	if err != nil {
		log.Fatalf("Could not start publisher. Error: %v\n", err.Error())
	}
	log.Printf("hi")

	go func() {
		Publisher.Listen()
		log.Printf("Publisher started on port :7003")
	}()
}

func Publish(event string) error {
	var e eventinfrastructure.Event

	// create the event
	e.Building = Building
	e.Device = Name
	e.Event = event
	e.Hostname = os.Getenv("PI_HOSTNAME")
	e.LocalEnvironment = len(os.Getenv("LOCAL_ENVIRONMENT")) > 0
	e.Room = Room
	// e.Success?
	e.Timestamp = time.Now().Format(time.RFC3339)

	toSend, err := json.Marshal(&e)
	if err != nil {
		return err
	}

	header := [24]byte{}
	copy(header[:], eventinfrastructure.UI)

	log.Printf("Publishing event: %+v", toSend)
	Publisher.Write(common.Message{MessageHeader: header, MessageBody: toSend})

	return nil
}

func getBuildingAndRoomAndName() {
	hostname := os.Getenv("PI_HOSTNAME")
	if len(hostname) < 1 {
		log.Fatalf("failed to get pi hostname. Is it set?")
		return
	}

	data := strings.Split(hostname, "-")

	Building = data[0]
	Room = data[1]
	Name = data[2]
	return
}
