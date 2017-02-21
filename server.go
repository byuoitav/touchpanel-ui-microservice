package main

import (
	"html/template"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/byuoitav/av-api/dbo"
	"github.com/byuoitav/raspi-tp/helpers"
	"github.com/byuoitav/raspi-tp/views"
	"github.com/jessemillar/health"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.Use(middleware.CORS())

	templateEngine := &helpers.Template{
		Templates: template.Must(template.ParseGlob("public/*/*.html")),
	}

	router.Renderer = templateEngine

	router.GET("/health", echo.WrapHandler(http.HandlerFunc(health.Check)))

	// get hostname, get room info based on hostname UNCOMMENT FOR USAGE
	// hostname, err := os.Hostname()
	// if err != nil {
	// 	log.Printf("couldn't get the hostname. error: %s", err)
	// }

	// temporary
	hostname := "ITB-1006"

	splitValues := strings.Split(hostname, "-")
	log.Printf("Room: %v-%v", splitValues[0], splitValues[1])

	attempts := 0
	room, err := dbo.GetRoomByInfo(splitValues[0], splitValues[1])
	// if there is an error retrieving the room info, try again a few times (configuration service may not be up)
	if err != nil {
		//If there was an error we want to attempt to connect multiple times - as the
		//configuration service may not be up.
		for attempts < 40 {
			log.Printf("Attempting to connect to DB...")
			room, err = dbo.GetRoomByInfo(splitValues[0], splitValues[1])
			if err != nil {
				log.Printf("error: %s", err)
				attempts++
				time.Sleep(2 * time.Second)
			} else {
				break
			}
		}
		if attempts > 30 && err != nil {
			log.Printf("Error Retrieving room information.")
		}
	}

	devices, err := dbo.GetDevicesByRoom(room.Building.Name, room.Name)
	if err == nil {
		log.Print("no devices available in room")
	} else {
		if devices == nil {

		}
	}

	// Views
	router.Static("/*", "public")
	router.GET("/", views.Main)

	router.Start(port)
}
