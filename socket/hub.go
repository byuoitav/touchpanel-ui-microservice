package socket

import (
	"log"

	"github.com/fatih/color"
)

type Hub struct {
	// registered clients
	clients map[*Client]bool

	// inbound messages from clients
	broadcast chan []byte

	// 'register' requests from clients
	register chan *Client

	// 'unregister' requests from clients
	unregister chan *Client
}

func NewHub() *Hub {
	hub := &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
	go hub.run()

	return hub
}

func (h *Hub) WriteToSockets(message []byte) {
	h.broadcast <- message
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			color.Set(color.FgYellow, color.Bold)
			log.Printf("New socket connection: %s", client.conn.LocalAddr())
			color.Unset()

			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				color.Set(color.FgYellow, color.Bold)
				log.Printf("Removing socket connection: %s", client.conn.LocalAddr())
				color.Unset()

				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
