package main

import (
	"net/http"
	"os"
	"time"

	ce "github.com/byuoitav/common/events"
	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/byuoitav/touchpanel-ui-microservice/handlers"
	"github.com/byuoitav/touchpanel-ui-microservice/socket"
	"github.com/byuoitav/touchpanel-ui-microservice/uiconfig"
	"github.com/jessemillar/health"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	filters := []string{ce.UI, ce.UIFeature}
	en := ce.NewEventNode("Touchpanel UI", os.Getenv("EVENT_ROUTER_ADDRESS"), filters)

	// websocket hub
	hub := socket.NewHub(en)
	go events.WriteEventsToSocket(en, hub)
	go events.SendRefresh(hub, time.NewTimer(time.Second*10))

	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.Use(middleware.CORS())
	// router.Use(echo.WrapMiddleware(authmiddleware.AuthenticateUser))

	router.GET("/health", echo.WrapHandler(http.HandlerFunc(health.Check)))
	router.GET("/mstatus", func(context echo.Context) error {
		return hub.GetStatus(context)
	})

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
	router.PUT("/socketTest", func(context echo.Context) error {
		events.SendTest(hub)
		return context.JSON(http.StatusOK, "sent")
	})

	router.GET("/pihostname", handlers.GetPiHostname)
	router.GET("/hostname", handlers.GetHostname)
	router.GET("/deviceinfo", handlers.GetDeviceInfo)
	router.GET("/reboot", handlers.Reboot)
	router.GET("/dockerstatus", handlers.GetDockerStatus)

	router.GET("/uiconfig", uiconfig.GetUIConfig)
	router.GET("/uipath", uiconfig.GetUIPath)
	router.GET("/api", uiconfig.GetAPI)
	router.GET("/nextapi", uiconfig.NextAPI)

	router.POST("/help", handlers.Help)
	router.POST("/confirmhelp", handlers.ConfirmHelp)
	router.POST("/cancelhelp", handlers.CancelHelp)

	// all the different ui's
	router.Static("/", "redirect.html")
	router.Any("/404", redirect)
	router.Static("/blueberry", "blueberry-dist")
	router.Static("/cherry", "cherry-dist")

	router.Start(port)
}

// BindEventNode ...
func BindEventNode(en *ce.EventNode) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set(ce.ContextEventNode, en)
			return next(c)
		}
	}
}

func redirect(context echo.Context) error {
	http.Redirect(context.Response().Writer, context.Request(), "http://github.com/404", 302)
	return nil
}
