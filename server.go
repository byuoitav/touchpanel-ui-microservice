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

	filters := []string{eventinfrastructure.UI}
	sub := eventinfrastructure.NewSubscriber(filters)

	//	ip := eventinfrastructure.GetIP()

	var req eventinfrastructure.ConnectionRequest
	req.PublisherAddr = "localhost:7003"
	req.SubscriberEndpoint = "http://localhost:8888/subscribe"

	// post to the router with the subscription request
	go eventinfrastructure.SendConnectionRequest("http://localhost:6999/subscribe", req)

	go events.WriteMessagesToSocket(sub)

	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.Use(middleware.CORS())

	router.GET("/health", echo.WrapHandler(http.HandlerFunc(health.Check)))

	// event endpoints
	router.POST("/subscribe", sub.HandleSubscriptionRequest)
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
