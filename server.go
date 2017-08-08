package main

import (
	"net/http"

	"github.com/byuoitav/device-monitoring-microservice/microservicestatus"
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
	go eventinfrastructure.SendConnectionRequest("http://localhost:6999/subscribe", req, true)

	go events.WriteMessagesToSocket(sub)
	go events.Refresh(sub)

	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.Use(middleware.CORS())

	router.GET("/health", echo.WrapHandler(http.HandlerFunc(health.Check)))
	router.GET("/status", GetStatus, BindPublisher(pub), BindSubscriber(sub))

	// event endpoints
	router.POST("/subscribe", Subscribe, BindSubscriber(sub))
	router.POST("/publish", handlers.PublishEvent, BindPublisher(pub))
	router.POST("/publishfeature", handlers.PublishFeature, BindPublisher(pub))

	router.GET("/websocket", handlers.OpenWebSocket)
	router.GET("/hostname", handlers.GetHostname)
	router.GET("/deviceinfo", handlers.GetDeviceInfo)
	router.GET("/reboot", handlers.Reboot)
	router.GET("/dockerstatus", handlers.GetDockerStatus)
	router.GET("/json", handlers.GetJSON)

	router.PUT("/screenoff", handlers.SendScreenOff, BindSubscriber(sub))

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

	s := context.Get(eventinfrastructure.ContextSubscriber)
	if sub, ok := s.(*eventinfrastructure.Subscriber); ok {
		err := eventinfrastructure.HandleSubscriptionRequest(cr, sub)
		if err != nil {
			return context.JSON(http.StatusBadRequest, err.Error())
		}
	}
	return context.JSON(http.StatusOK, nil)
}

func BindPublisher(p *eventinfrastructure.Publisher) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set(eventinfrastructure.ContextPublisher, p)
			return next(c)
		}
	}
}

func BindSubscriber(s *eventinfrastructure.Subscriber) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set(eventinfrastructure.ContextSubscriber, s)
			return next(c)
		}
	}
}

func GetStatus(context echo.Context) error {
	var s microservicestatus.Status
	s.Version = "0.0"

	s.Status = microservicestatus.StatusOK
	s.StatusInfo = ""

	return context.JSON(http.StatusOK, s)
}
