package main

import (
	"fmt"
	"net/http"

	"github.com/byuoitav/device-monitoring-microservice/statusinfrastructure"
	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/byuoitav/touchpanel-ui-microservice/handlers"
	"github.com/jessemillar/health"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	filters := []string{eventinfrastructure.UI}
	en := eventinfrastructure.NewEventNode("Touchpanel UI", "7003", filters)

	//	ip := eventinfrastructure.GetIP()

	var req eventinfrastructure.ConnectionRequest
	req.PublisherAddr = "localhost:7003"
	req.SubscriberEndpoint = "http://localhost:8888/subscribe"

	// post to the router with the subscription request
	go eventinfrastructure.SendConnectionRequest("http://localhost:6999/subscribe", req, true)

	go events.WriteMessagesToSocket(en)
	go events.Refresh(en)

	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.Use(middleware.CORS())

	router.GET("/health", echo.WrapHandler(http.HandlerFunc(health.Check)))
	router.GET("/mstatus", GetStatus)

	// event endpoints
	router.POST("/subscribe", Subscribe, BindEventNode(en))
	router.POST("/publish", handlers.PublishEvent, BindEventNode(en))
	router.POST("/publishfeature", handlers.PublishFeature, BindEventNode(en))

	router.GET("/websocket", handlers.OpenWebSocket)
	router.GET("/hostname", handlers.GetHostname)
	router.GET("/deviceinfo", handlers.GetDeviceInfo)
	router.GET("/reboot", handlers.Reboot)
	router.GET("/dockerstatus", handlers.GetDockerStatus)
	router.GET("/json", handlers.GetJSON)

	router.PUT("/screenoff", handlers.SendScreenOff, BindEventNode(en))

	router.POST("/help", handlers.Help)
	router.POST("/confirmhelp", handlers.ConfirmHelp)
	router.POST("/cancelhelp", handlers.CancelHelp)

	router.Static("/", "redirect.html")
	router.Static("/circle-default", "circle-default")

	router.Start(port)
}

func Subscribe(context echo.Context) error {
	var cr eventinfrastructure.ConnectionRequest
	context.Bind(&cr)

	e := context.Get(eventinfrastructure.ContextEventNode)
	if en, ok := e.(*eventinfrastructure.EventNode); ok {
		err := eventinfrastructure.HandleSubscriptionRequest(cr, en)
		if err != nil {
			return context.JSON(http.StatusBadRequest, err.Error())
		}
	}
	return context.JSON(http.StatusOK, nil)
}

func BindEventNode(en *eventinfrastructure.EventNode) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set(eventinfrastructure.ContextEventNode, en)
			return next(c)
		}
	}
}

func GetStatus(context echo.Context) error {
	var s statusinfrastructure.Status
	var err error

	s.Version, err = statusinfrastructure.GetVersion("version.txt")
	if err != nil {
		s.Version = "missing"
		s.Status = statusinfrastructure.StatusSick
		s.StatusInfo = fmt.Sprintf("Error: %s", err.Error())
	} else {
		s.Status = statusinfrastructure.StatusOK
		s.StatusInfo = ""
	}

	return context.JSON(http.StatusOK, s)
}
