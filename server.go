package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"

	"github.com/byuoitav/central-event-system/hub/base"
	"github.com/byuoitav/central-event-system/messenger"

	commonEvents "github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/touchpanel-ui-microservice/db"
	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/byuoitav/touchpanel-ui-microservice/handlers"
	"github.com/byuoitav/touchpanel-ui-microservice/socket"
	"github.com/byuoitav/touchpanel-ui-microservice/uiconfig"
)

var (
	logger *slog.Logger
	//go:embed cherry/*
	embeddedFiles embed.FS
)

func main() {
	// set up logger
	var logLevel = new(slog.LevelVar)
	logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel}))
	slog.SetDefault(logger)
	logLevel.Set(slog.LevelDebug)

	deviceInfo := commonEvents.GenerateBasicDeviceInfo(os.Getenv("SYSTEM_ID"))
	messenger, messengerErr := messenger.BuildMessenger(os.Getenv("HUB_ADDRESS"), base.Messenger, 1000)
	if messengerErr != nil {
		logger.Error("unable to build the messenger", "error", messengerErr.Error())
	}

	messenger.SubscribeToRooms(deviceInfo.RoomID)
	socket.SetMessenger(messenger)

	// Setup Cherry frontend
	subFS, err := fs.Sub(embeddedFiles, "cherry")
	if err != nil {
		logger.Error("unable to get sub filesystem for cherry", "error", err.Error())
		return
	}

	// websocket hub
	go events.WriteEventsToSocket(messenger)
	go events.SendRefresh(time.NewTimer(time.Second * 10))

	port := ":8888"
	router := gin.Default()

	// Static file serving for blueberry
	router.Use(static.Serve("/blueberry", static.LocalFile("blueberry-dist", true)))

	router.GET("/status", func(c *gin.Context) {
		socket.GetStatus(c)
	})

	router.POST("/publish", func(c *gin.Context) {
		var event commonEvents.Event
		if err := c.ShouldBindJSON(&event); err != nil {
			c.String(http.StatusBadRequest, err.Error())
			return
		}
		messenger.SendEvent(event)
		logger.Debug("sent event from UI", "event", event)
		c.String(http.StatusOK, "success")
	})

	router.GET("/websocket", func(c *gin.Context) {
		socket.ServeWebsocket(c.Writer, c.Request)
	})

	router.PUT("/screenoff", func(c *gin.Context) {
		events.SendScreenTimeout()
		c.Status(http.StatusOK)
	})
	router.PUT("/refresh", func(c *gin.Context) {
		events.SendRefresh(time.NewTimer(0))
		c.Status(http.StatusOK)
	})
	router.PUT("/socketTest", func(c *gin.Context) {
		events.SendTest()
		c.JSON(http.StatusOK, "sent")
	})

	router.GET("/pihostname", func(c *gin.Context) { handlers.GetPiHostname(c) })
	router.GET("/hostname", func(c *gin.Context) { handlers.GetHostname(c) })
	router.GET("/deviceinfo", func(c *gin.Context) { handlers.GetDeviceInfo(c) })
	router.GET("/reboot", func(c *gin.Context) { handlers.Reboot(c) })

	router.GET("/uiconfig", func(c *gin.Context) { uiconfig.GetUIConfig(c) })
	router.GET("/uipath", func(c *gin.Context) { uiconfig.GetUIPath(c) })
	router.GET("/api", func(c *gin.Context) { uiconfig.GetAPI(c) })
	router.GET("/nextapi", func(c *gin.Context) { uiconfig.NextAPI(c) })
	router.GET("/control-key/:room/:controlGroup", func(c *gin.Context) { handlers.GetControlKey(c) })
	router.POST("/help", func(c *gin.Context) { handlers.GenerateHelpFunction("request", messenger) })
	router.POST("/confirmhelp", func(c *gin.Context) { handlers.GenerateHelpFunction("confirm", messenger) })
	router.POST("/cancelhelp", func(c *gin.Context) { handlers.GenerateHelpFunction("cancel", messenger) })

	router.POST("/camera-control", func(c *gin.Context) { handlers.HandleCameraControl(logger, c) })

	router.GET("/themeconfig", func(c *gin.Context) { uiconfig.GetThemeConfig(c) })
	router.GET("/logo", func(c *gin.Context) { uiconfig.GetLogo(c) })

	router.GET("/blueberry/db/:attachment", getCouchAttachment("blueberry"))
	// router.GET("/cherry/db/:attachment", getCouchAttachment("cherry"))

	router.StaticFS("/vanilla-cherry", http.FS(subFS))

	// Static file serving for root and 404
	router.StaticFile("/", "redirect.html")
	router.NoRoute(func(c *gin.Context) {
		if c.Request.URL.Path == "/" {
			c.Redirect(http.StatusFound, "/vanilla-cherry/")
		} else if len(c.Request.URL.Path) >= 5 && c.Request.URL.Path[:5] == "/vanilla-cherry/" {
			c.FileFromFS("index.html", http.FS(subFS))
		} else {
			c.String(http.StatusNotFound, "Not found")
			logger.Error("404 Not Found", "path", c.Request.URL.Path)
		}
	})

	router.Run(port)
}

func getCouchAttachment(ui string) func(*gin.Context) {
	return func(c *gin.Context) {
		attachment := c.Param("attachment")
		logger.Debug("Getting attachment", "attachment", attachment, "ui", ui)

		typeString, bytes, err := db.GetDB().GetUIAttachment(ui, attachment)
		if err != nil {
			c.String(http.StatusInternalServerError, fmt.Sprintf("failed to get %s: %v", attachment, err))
			return
		}

		c.Data(http.StatusOK, typeString, bytes)
	}
}
