package events

import (
	"log"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/xuther/go-message-router/subscriber"
)

var Sub subscriber.Subscriber

func SubInit() {
	var err error
	Sub, err = subscriber.NewSubscriber(10)
	if err != nil {
		log.Fatalf("Could not create a subscriber. Error: %v\n", err.Error())
	}

	Sub.Subscribe("localhost:7003", []string{eventinfrastructure.UI})
	log.Printf("Subscribed to %s events", eventinfrastructure.UI)

	go SubListen()
}

func SubListen() {
	log.Printf("Subscriber is listening for events")

	for {
		message := Sub.Read()
		log.Printf("Message Recieved: %s", message.MessageBody)
	}
}
