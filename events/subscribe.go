package events

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/event-router-microservice/subscription"
	"github.com/gorilla/websocket"
	"github.com/xuther/go-message-router/common"
	"github.com/xuther/go-message-router/subscriber"
)

var Sub subscriber.Subscriber
var refresh chan common.Message

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
	refresh = make(chan common.Message)

	var err error
	Sub, err = subscriber.NewSubscriber(10)
	if err != nil {
		log.Printf("Could not create a subscriber. Error: %v\n", err.Error())
	}

	var s subscription.SubscribeRequest
	s.Address = "localhost:7003" // address of our publisher
	s.PubAddress = "localhost:8888/subscribe"
	body, err := json.Marshal(s)
	if err != nil {
		log.Printf("[error] %s", err)
	}

	log.Printf("Creating two-way connection with router")
	_, err = http.Post("http://localhost:6999/subscribe", "application/json", bytes.NewBuffer(body))
	for err != nil {
		log.Printf("[error] failed to connect to the router. Trying again...")
		time.Sleep(3 * time.Second)
		_, err = http.Post("http://localhost:6999/subscribe", "application/json", bytes.NewBuffer(body))
	}

	go Manager.Start(UIFilter)
	go SubListen()
	go waitForRefresh()

	time.Sleep(12 * time.Second)
	Refresh()
}

func (manager *ClientManager) Start(f filter) {
	go manager.keepalive()
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
				conn.send <- toSend
			}
		}
	}
}

func Refresh() {
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

	refresh <- common.Message{MessageHeader: header, MessageBody: msg}
}

func (manager *ClientManager) keepalive() {
	var e eventinfrastructure.Event
	e.Hostname = os.Getenv("PI_HOSTNAME")
	e.Timestamp = time.Now().Format(time.RFC3339)
	e.Event.EventInfoKey = "keepalive"
	msg, err := json.Marshal(&e)
	if err != nil {
		log.Fatalf("[error] %s", err.Error())
	}

	for {
		for k, _ := range manager.clients {
			log.Printf("[client] Sending keep alive message")
			k.send <- msg
		}
		time.Sleep(45 * time.Second)
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

func waitForRefresh() {
	log.Printf("[Subscriber] Waiting for refresh messages")
	for {
		select {
		case msg, ok := <-refresh:
			if ok {
				log.Printf("Writing refresh")
				Manager.Broadcast <- msg
			} else {
				log.Printf("[Subscriber] refresh chan closed")
			}
		}
	}
}
