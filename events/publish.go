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

var Pub publisher.Publisher
var Building string
var Room string
var Name string

func Init() {
	getBuildingAndRoomAndName()
	var err error
	Pub, err = publisher.NewPublisher("7003", 1000, 10)
	if err != nil {
		log.Fatalf("Could not start publisher. Error: %v\n", err.Error())
	}

	go Pub.Listen()
	SubInit()
}

func Publish(event json.RawMessage) error {
	var e eventinfrastructure.Event

	ebyte, err := json.Marshal(event)
	estr := string(ebyte[:])

	// create the event
	e.Building = Building
	e.Device = Name
	e.Event = estr
	e.Hostname = os.Getenv("PI_HOSTNAME")
	e.LocalEnvironment = len(os.Getenv("LOCAL_ENVIRONMENT")) > 0
	e.Room = Room
	e.Success = true
	e.Timestamp = time.Now().Format(time.RFC3339)

	toSend, err := json.Marshal(&e)
	if err != nil {
		return err
	}

	header := [24]byte{}
	copy(header[:], []byte(eventinfrastructure.UI))

	log.Printf("Publishing event: %s", toSend)
	err = Pub.Write(common.Message{MessageHeader: header, MessageBody: toSend})
	if err != nil {
		return err
	}

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

	log.Printf("Building: %s, Room: %s, Device: %s", Building, Room, Name)
	return
}
