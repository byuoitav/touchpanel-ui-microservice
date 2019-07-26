package socket

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/byuoitav/central-event-system/messenger"
	logger "github.com/byuoitav/common/log"
	"github.com/byuoitav/common/status"
	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/device-monitoring/localsystem"
	"github.com/fatih/color"
	"github.com/labstack/echo"
)

// H is the socket hub
var H *hub

func init() {
	H = &hub{
		broadcast:  make(chan interface{}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}

	go H.run()
}

// hub is a socket hub
type hub struct {
	// registered clients
	clients map[*Client]bool

	// inbound messages from clients
	broadcast chan interface{}

	// 'register' requests from clients
	register chan *Client

	// 'unregister' requests from clients
	unregister chan *Client

	messenger *messenger.Messenger
}

// SetMessenger .
func SetMessenger(m *messenger.Messenger) {
	H.messenger = m
}

// GetStatus returns the status of the hub along with the program
func GetStatus(context echo.Context) error {
	log.Printf("Status request from %v", context.Request().RemoteAddr)

	var err error
	stat := status.NewStatus()

	stat.Bin = os.Args[0]
	stat.Uptime = status.GetProgramUptime().String()

	stat.Version, err = status.GetMicroserviceVersion()
	if err != nil {
		stat.StatusCode = status.Sick
		stat.Info["error"] = "failed to open version.txt"
		return context.JSON(http.StatusInternalServerError, stat)
	}

	stat.StatusCode = status.Healthy

	stat.Info["websocket-connections"] = len(H.clients)
	var wsInfo []map[string]interface{}

	for client := range H.clients {
		info := make(map[string]interface{})
		localAddr := client.conn.LocalAddr()
		remoteAddr := client.conn.RemoteAddr()
		info["raw-connection"] = fmt.Sprintf("%s => %s", remoteAddr, localAddr)

		resolvedLocal, err := net.LookupAddr(strings.Split(localAddr.String(), ":")[0])
		if err != nil {
			info["resolve-local-error"] = err.Error()
		}

		resolvedRemote, err := net.LookupAddr(strings.Split(remoteAddr.String(), ":")[0])
		if err != nil {
			info["resolve-remote-error"] = err.Error()
		}
		info["resolved-connection"] = fmt.Sprintf("%s => %s", resolvedRemote, resolvedLocal)

		wsInfo = append(wsInfo, info)
	}

	stat.Info["websocket-info"] = wsInfo

	return context.JSON(http.StatusOK, stat)
}

func (h *hub) WriteToSockets(message interface{}) {
	h.broadcast <- message
}

func (h *hub) run() {
	id := localsystem.MustSystemID()
	// id := "ITB-1010-CP1"
	deviceInfo := events.GenerateBasicDeviceInfo(id)
	roomInfo := events.GenerateBasicRoomInfo(deviceInfo.RoomID)

	go h.reportWebSocketCount()

	for {
		select {
		case client := <-h.register:
			remoteAddr := client.conn.RemoteAddr()

			h.clients[client] = true

			color.Set(color.FgYellow, color.Bold)
			log.Printf("New socket connection: %s", remoteAddr)
			color.Unset()

			event := events.Event{
				GeneratingSystem: id,
				Timestamp:        time.Now(),
				EventTags:        []string{events.DetailState},
				TargetDevice:     deviceInfo,
				AffectedRoom:     roomInfo,
				User:             remoteAddr.String(),
				Key:              "websocket",
				Value:            fmt.Sprintf("opened with %s", remoteAddr),
			}

			countEvent := events.Event{
				GeneratingSystem: id,
				Timestamp:        time.Now(),
				EventTags:        []string{events.DetailState},
				TargetDevice:     deviceInfo,
				AffectedRoom:     roomInfo,
				Key:              "websocket-count",
				Value:            fmt.Sprintf("%v", len(h.clients)),
			}

			resolvedRemote, err := net.LookupAddr(strings.Split(remoteAddr.String(), ":")[0])
			if err == nil {
				event.Value = fmt.Sprintf("opened with %s", resolvedRemote)
				event.User = fmt.Sprintf("%s", resolvedRemote)
			}

			if h.messenger != nil {
				h.messenger.SendEvent(event)
				h.messenger.SendEvent(countEvent)
			}
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				remoteAddr := client.conn.RemoteAddr()

				delete(h.clients, client)
				close(client.send)

				color.Set(color.FgYellow, color.Bold)
				log.Printf("Removed socket connection: %s", remoteAddr)
				color.Unset()

				event := events.Event{
					GeneratingSystem: id,
					Timestamp:        time.Now(),
					EventTags:        []string{events.DetailState},
					TargetDevice:     deviceInfo,
					AffectedRoom:     roomInfo,
					User:             remoteAddr.String(),
					Key:              "websocket",
					Value:            fmt.Sprintf("closed with %s", remoteAddr),
				}

				countEvent := events.Event{
					GeneratingSystem: id,
					Timestamp:        time.Now(),
					EventTags:        []string{events.DetailState},
					TargetDevice:     deviceInfo,
					AffectedRoom:     roomInfo,
					Key:              "websocket-count",
					Value:            fmt.Sprintf("%v", len(h.clients)),
				}

				resolvedRemote, err := net.LookupAddr(strings.Split(remoteAddr.String(), ":")[0])
				if err == nil {
					event.Value = fmt.Sprintf("closed with %s", resolvedRemote)
					event.User = fmt.Sprintf("%s", resolvedRemote)
				}

				if h.messenger != nil {
					h.messenger.SendEvent(event)
					h.messenger.SendEvent(countEvent)
				}
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

func (h *hub) reportWebSocketCount() {
	id := localsystem.MustSystemID()
	// id := "ITB-1010-CP1"
	deviceInfo := events.GenerateBasicDeviceInfo(id)
	roomInfo := events.GenerateBasicRoomInfo(deviceInfo.RoomID)

	for {
		logger.L.Debugf("sending websocket count of: %d", len(h.clients))
		countEvent := events.Event{
			GeneratingSystem: id,
			Timestamp:        time.Now(),
			EventTags:        []string{events.DetailState},
			TargetDevice:     deviceInfo,
			AffectedRoom:     roomInfo,
			Key:              "websocket-count",
			Value:            fmt.Sprintf("%v", len(h.clients)),
		}

		if h.messenger != nil {
			h.messenger.SendEvent(countEvent)
		}

		time.Sleep(3 * time.Minute)
	}
}
