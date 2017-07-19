package main

import (
	"net/http"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/byuoitav/touchpanel-ui-microservice/handlers"
	"github.com/jessemillar/health"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	pub := eventinfrastructure.NewPublisher("7003")
	sub := eventinfrastructure.NewSubscriber()

	go events.WriteMessagesToSocket(sub)

	filters := []string{eventinfrastructure.UI}
	pubAddr := "http://" + eventinfrastructure.GetIP() + ":7003"

	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.Use(middleware.CORS())

	router.GET("/health", echo.WrapHandler(http.HandlerFunc(health.Check)))

	// event endpoints
	router.POST("/subscribe", eventinfrastructure.Subscribe, eventinfrastructure.BindSubscriber(sub), eventinfrastructure.BindFiltersAndPublisherAddress(filters, pubAddr))
	router.POST("/publish", handlers.PublishEvent, eventinfrastructure.BindPublisher(pub))
	router.POST("/publishfeature", handlers.PublishFeature, eventinfrastructure.BindPublisher(pub))

	router.GET("/websocket", handlers.OpenWebSocket)
	router.GET("/hostname", handlers.GetHostname)
	router.GET("/deviceinfo", handlers.GetDeviceInfo)
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
