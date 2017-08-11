package socket

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/fatih/color"
	"github.com/gorilla/websocket"
)

type filter func(i interface{}) interface{}

type SocketManager struct {
	Write chan []byte
	Read  chan []byte

	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
}

type Client struct {
	socket *websocket.Conn
	send   chan []byte
}

func NewSocketManager(keepAliveMsg interface{}, f filter) *SocketManager {
	sm := &SocketManager{
		Write:      make(chan []byte, 100),
		Read:       make(chan []byte, 100),
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}

	sm.keepalive(keepAliveMsg)
	sm.start(f)
	return sm
}

func StartWebClient(sm *SocketManager, res http.ResponseWriter, req *http.Request) {
	conn, err := (&websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}).Upgrade(res, req, nil)
	if err != nil {
		http.NotFound(res, req)
		return
	}

	client := &Client{socket: conn, send: make(chan []byte)}

	sm.register <- client

	go client.read(sm)
}

func (c *Client) read(sm *SocketManager) {
	for {
		if _, msg, err := c.socket.ReadMessage(); err != nil {
			sm.Read <- msg
		}
	}
}

func (manager *SocketManager) start(f filter) {
	for {
		select {
		case conn := <-manager.register:
			color.Set(color.FgHiMagenta, color.Bold)
			log.Printf("Registering socket connection: %s", conn.socket.RemoteAddr())
			color.Unset()

			manager.clients[conn] = true

			break
		case conn := <-manager.unregister:
			color.Set(color.FgHiMagenta, color.Bold)
			log.Printf("Unregistering socket connection: %s", conn.socket.RemoteAddr())
			color.Unset()

			if _, ok := manager.clients[conn]; ok {
				close(conn.send)
				delete(manager.clients, conn)
			}

			break
		case msg := <-manager.Write:
			m := f(msg)

			for conn := range manager.clients {
				conn.socket.WriteJSON(m)
			}

			break
		}
	}
}

func (manager *SocketManager) keepalive(keepAliveMsg interface{}) {
	var e eventinfrastructure.Event
	e.Hostname = os.Getenv("PI_HOSTNAME")
	e.Timestamp = time.Now().Format(time.RFC3339)
	e.Event.EventInfoKey = "keepalive"

	msg, err := json.Marshal(&e)
	if err != nil {
		log.Fatalf("[error] %s", err.Error())
	}

	for {
		for c, _ := range manager.clients {
			color.Set(color.FgYellow)
			log.Printf("Sending keep alive message")
			color.Unset()
			c.send <- msg
		}
		time.Sleep(45 * time.Second)
	}
}
