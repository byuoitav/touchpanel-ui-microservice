package main

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/byuoitav/device-monitoring-microservice/statusinfrastructure"
	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/byuoitav/touchpanel-ui-microservice/handlers"
	"github.com/byuoitav/touchpanel-ui-microservice/socket"
	"github.com/byuoitav/touchpanel-ui-microservice/uiconfig"
	"github.com/jessemillar/health"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	filters := []string{eventinfrastructure.UI}
	en := eventinfrastructure.NewEventNode("Touchpanel UI", "7003", filters, os.Getenv("EVENT_ROUTER_ADDRESS"))

	// websocket hub
	hub := socket.NewHub()
	go events.WriteEventsToSocket(en, hub)
	go events.SendRefresh(hub, time.NewTimer(time.Second*10))

	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.Use(middleware.CORS())

	router.GET("/health", echo.WrapHandler(http.HandlerFunc(health.Check)))
	router.GET("/mstatus", GetStatus)

	// event endpoints
	router.POST("/publish", handlers.PublishEvent, BindEventNode(en))
	router.POST("/publishfeature", handlers.PublishFeature, BindEventNode(en))

	// websocket
	router.GET("/websocket", func(context echo.Context) error {
		socket.ServeWebsocket(hub, context.Response().Writer, context.Request())
		return nil
	})

	// socket endpoints
	router.PUT("/screenoff", func(context echo.Context) error {
		events.SendScreenTimeout(hub)
		return nil
	})
	router.PUT("/refresh", func(context echo.Context) error {
		events.SendRefresh(hub, time.NewTimer(0))
		return nil
	})
	router.GET("/wsinfo", func(context echo.Context) error {
		si, _ := socket.GetSocketInfo(hub)
		return context.JSON(http.StatusOK, si)
	})

	router.GET("/hostname", handlers.GetHostname)
	router.GET("/deviceinfo", handlers.GetDeviceInfo)
	router.GET("/reboot", handlers.Reboot)
	router.GET("/dockerstatus", handlers.GetDockerStatus)

	router.GET("/uiconfig", handlers.GetUIConfig)

	router.GET("/api", uiconfig.GetAPI)
	router.GET("/nextapi", uiconfig.NextAPI)

	router.POST("/help", handlers.Help)
	router.POST("/confirmhelp", handlers.ConfirmHelp)
	router.POST("/cancelhelp", handlers.CancelHelp)

	// all the different ui's
	router.Static("/", "redirect.html")
	router.Static("/circle-default", "circle-default")

	router.Start(port)
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
