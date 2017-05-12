package events

import (
	"encoding/json"
	"log"

	"golang.org/x/net/websocket"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/xuther/go-message-router/common"
	"github.com/xuther/go-message-router/subscriber"
)

var Sub subscriber.Subscriber

type ClientManager struct {
	clients    map[*Client]bool
	Broadcast  chan common.Message
	register   chan *Client
	unregister chan *Client
}

type Client struct {
	socket *websocket.Conn
	send   chan []byte
}

var Manager = &ClientManager{
	Broadcast:  make(chan common.Message, 100),
	register:   make(chan *Client),
	unregister: make(chan *Client),
	clients:    make(map[*Client]bool),
}

func SubInit() {
	var err error
	Sub, err = subscriber.NewSubscriber(10)
	if err != nil {
		log.Fatalf("Could not create a subscriber. Error: %v\n", err.Error())
	}

	Sub.Subscribe("localhost:7003", []string{eventinfrastructure.UI})
	log.Printf("Subscribed to %s events", eventinfrastructure.UI)

	go Manager.Start()
	go SubListen()
}

func (manager *ClientManager) Start(filter func()) {
	for {
		select {
		case conn := <-manager.register:
			log.Printf("Registering connection")
			manager.clients[conn] = true

		case conn := <-manager.unregister:
			log.Printf("Unregistering connection")
			if _, ok := manager.clients[conn]; ok {
				close(conn.send)
				delete(manager.clients, conn)
			}

		case event := <-manager.Broadcast:
			log.Printf("Sending event %s", event.MessageBody)
			toSend, err := json.Marshal(&event.MessageBody)
			if err != nil {
				continue
			}
			var e eventinfrastructure.Event
			err = json.Unmarshal(toSend, &e)
			for conn := range manager.clients {
				select {
				case conn.send <- toSend:
				default:
					close(conn.send)
					delete(manager.clients, conn)
				}
			}
		}
	}
}

func UIFilter(event common.Message) (eventinfrastructure.EventInfo, error) {
	var e eventinfrastructure.EventInfo
	toSend, err := json.Marshal(&event.MessageBody)
	if err != nil {
		return e, err
	}
	err = json.Unmarshal(toSend, &e)
	if err != nil {
		return e, err
	}

	log.Printf("event: %v", e)
	return e, nil
}

func SubListen() {
	log.Printf("Subscriber is listening for events")

	for {
		message := Sub.Read()
		log.Printf("Recieved message. Sending to socket")
		Manager.Broadcast <- message
	}
}
