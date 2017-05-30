package events

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/gorilla/websocket"
	"github.com/xuther/go-message-router/common"
	"github.com/xuther/go-message-router/subscriber"
)

var Sub subscriber.Subscriber

type filter func(common.Message) eventinfrastructure.EventInfo

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
		log.Printf("Could not create a subscriber. Error: %v\n", err.Error())
	}

	for ok := true; ok; ok = (err != nil) {
		err = Sub.Subscribe("localhost:7000", []string{eventinfrastructure.UI})
		if err != nil {
			log.Printf("Failed to subscribe to events on port :7000. Trying again...")
			time.Sleep(1 * time.Second)
		}
	}

	log.Printf("[Routing] Subscribed to %s events on port :7000", eventinfrastructure.UI)

	go Manager.Start(UIFilter)
	go SubListen()
}

func (manager *ClientManager) Start(f filter) {
	for {
		select {
		case conn := <-manager.register:
			log.Printf("[Socket] Registering connection")
			manager.clients[conn] = true

		case conn := <-manager.unregister:
			log.Printf("[Socket] Unregistering connection")
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

func (c *Client) write() {
	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				log.Printf("[Client] client send channel closed")
				return
			}

			log.Printf("[Client] Writing event to client")
			c.socket.WriteMessage(websocket.TextMessage, message)
		}
	}
}

func (c *Client) read() {
	for {
		if _, _, err := c.socket.NextReader(); err != nil {
			log.Printf("[Client] Unregistering connection")
			Manager.unregister <- c
			break
		}
	}
}

func StartWebClient(res http.ResponseWriter, req *http.Request) {
	conn, err := (&websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}).Upgrade(res, req, nil)
	if err != nil {
		http.NotFound(res, req)
		return
	}

	client := &Client{socket: conn, send: make(chan []byte)}

	Manager.register <- client

	go client.write()
	go client.read()
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
		log.Printf("[Subscriber] Recieved event: %s", message)
		Manager.Broadcast <- message
	}
}
