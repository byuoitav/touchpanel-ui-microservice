package events

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/fatih/color"
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

func WriteMessagesToSocket(sub *eventinfrastructure.Subscriber) {
	go Manager.Start(UIFilter)

	for {
		select {
		case message, ok := <-sub.MessageChan:
			if !ok {
				log.Fatalf("[error] subscriber read channel closed")
			}
			Manager.Broadcast <- message
		}
	}
}

func Refresh(sub *eventinfrastructure.Subscriber) {
	defer color.Unset()
	for i := 15; i > 0; i-- {
		color.Set(color.FgYellow)
		log.Printf("Refreshing webpage in %v...", i)
		color.Unset()

		time.Sleep(1 * time.Second)
	}
	sub.MessageChan <- GetRefreshMessage()

	color.Set(color.FgGreen, color.Bold)
	log.Printf("Wrote refresh message.")
}

func (manager *ClientManager) Start(f filter) {
	go manager.keepalive()
	for {
		select {
		case conn := <-manager.register:
			color.Set(color.FgHiMagenta, color.Bold)
			log.Printf("Registering socket connection: %s", conn.socket.RemoteAddr())
			color.Unset()

			manager.clients[conn] = true

		case conn := <-manager.unregister:
			color.Set(color.FgHiMagenta, color.Bold)
			log.Printf("Unregistering socket connection: %s", conn.socket.RemoteAddr())
			color.Unset()
			if _, ok := manager.clients[conn]; ok {
				close(conn.send)
				delete(manager.clients, conn)
			}

		case event := <-manager.Broadcast:
			e := f(event)
			toSend, err := json.Marshal(&e)
			if err != nil {
				color.Set(color.FgRed)
				log.Printf("error: %s", err.Error())
				color.Unset()
				continue
			}
			for conn := range manager.clients {
				conn.send <- toSend
			}
		}
	}
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
			color.Set(color.FgYellow)
			log.Printf("Sending keep alive message")
			color.Unset()
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
				color.Set(color.FgHiCyan)
				log.Printf("[%s] client send channel closed", c.socket.RemoteAddr())
				color.Unset()
				return
			}
			color.Set(color.FgHiCyan)
			log.Printf("[%s] Writing event to client.", c.socket.RemoteAddr())
			color.Unset()
			c.socket.WriteMessage(websocket.TextMessage, message)
		}
	}
}

func (c *Client) read() {
	for {
		if _, _, err := c.socket.NextReader(); err != nil {
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
		color.Set(color.FgRed)
		log.Printf("error: %v", err.Error())
		color.Unset()
		return eventinfrastructure.EventInfo{}
	}

	return e.Event
}
