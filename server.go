package main

import (
	"net/http"

	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/byuoitav/touchpanel-ui-microservice/handlers"
	"github.com/jessemillar/health"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	go events.Init()

	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.Use(middleware.CORS())

	router.GET("/health", echo.WrapHandler(http.HandlerFunc(health.Check)))

	router.GET("/websocket", handlers.OpenWebSocket)
	router.POST("/subscribe", handlers.Subscribe)
	router.GET("/hostname", handlers.GetHostname)
	router.PUT("/publish", handlers.PublishEvent)
	router.GET("/deviceinfo", handlers.GetDeviceInfo)
	router.GET("/reboot", handlers.Reboot)
	router.GET("/dockerstatus", handlers.GetDockerStatus)

	router.Static("/", "dist")

	router.Start(port)
}
