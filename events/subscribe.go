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

type filter func(common.Message) eventinfrastructure.EventInfo

func SubInit() {
	var err error
	Sub, err = subscriber.NewSubscriber(10)
	if err != nil {
		log.Fatalf("Could not create a subscriber. Error: %v\n", err.Error())
	}

	Sub.Subscribe("localhost:7003", []string{eventinfrastructure.UI})
	log.Printf("Subscribed to %s events", eventinfrastructure.UI)

	go Manager.Start(UIFilter)
	go SubListen()
}

func (manager *ClientManager) Start(f filter) {
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
			e := f(event)
			toSend, err := json.Marshal(&e)
			if err != nil {
				log.Printf("error: %s", err.Error())
				continue
			}
			log.Printf("[Socket] Sending event: %s", toSend)
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

func UIFilter(event common.Message) eventinfrastructure.EventInfo {
	var e eventinfrastructure.Event
	err := json.Unmarshal(event.MessageBody, &e)
	if err != nil {
		log.Printf("error: %v", err.Error())
		return eventinfrastructure.EventInfo{}
	}

	return e.Event
}

func SubListen() {
	log.Printf("Subscriber is listening for events")

	for {
		message := Sub.Read()
		Manager.Broadcast <- message
	}
}
