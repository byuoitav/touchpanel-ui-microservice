package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/touchpanel-ui-microservice/handlers"
	"github.com/jessemillar/health"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

var (
	Subscriber *eventinfrastructure.Subscriber
	Building   string
	Room       string
	DeviceName string
	Dev        bool
)

func main() {
	//	events.Init()
	pub := eventinfrastructure.NewPublisher("7003")

	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.Use(middleware.CORS())

	router.GET("/health", echo.WrapHandler(http.HandlerFunc(health.Check)))

	// event endpoints
	router.POST("/subscribe", handlers.NewSubscribe)
	router.POST("/publish", handlers.PublishEvent, eventinfrastructure.BindPublisher(pub))
	router.POST("/publishfeature", handlers.PublishFeature, eventinfrastructure.BindPublisher(pub))

	router.GET("/websocket", handlers.OpenWebSocket)
	router.GET("/hostname", handlers.GetHostname)
	router.GET("/deviceinfo", handlers.GetDeviceInfo)
	router.GET("/refresh", handlers.Refresh)
	router.GET("/reboot", handlers.Reboot)
	router.GET("/dockerstatus", handlers.GetDockerStatus)
	router.GET("/json", handlers.GetJSON)

	router.POST("/help", handlers.Help)
	router.POST("/confirmhelp", handlers.ConfirmHelp)
	router.POST("/cancelhelp", handlers.CancelHelp)

	router.Static("/", "redirect.html")
	router.Static("/circle-default", "circle-default")

	router.Start(port)
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
	DeviceName = data[2]

	log.Printf("Building: %s, Room: %s, Device: %s", Building, Room, DeviceName)

	Dev = false
	if len(os.Getenv("DEVELOPMENT_HOSTNAME")) != 0 {
		Dev = true
		log.Printf("Development machine. Using hostname %s", os.Getenv("DEVELOPMENT_HOSTNAME"))
	}
	return
}
