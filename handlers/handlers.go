package handlers

import (
	"log"
	"net/http"
	"os"
	"os/exec"

	"github.com/byuoitav/event-router-microservice/eventinfrastructure"
	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/labstack/echo"
)

func OpenWebSocket(context echo.Context) error {
	events.StartWebClient(context.Response(), context.Request())
	return nil
}

func GetHostname(context echo.Context) error {
	hostname := os.Getenv("PI_HOSTNAME")
	return context.JSON(http.StatusOK, hostname)
}

func PublishEvent(context echo.Context) error {
	var event eventinfrastructure.EventInfo
	err := context.Bind(&event)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	err = events.Publish(event)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	return context.JSON(http.StatusOK, event)
}

func Reboot(context echo.Context) error {
	log.Printf("pi is rebooting")

	out, err := exec.Command("sh", "-c", "reboot").Output()
	if err != nil {
		log.Printf("error rebooting %s", err.Error())
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	log.Printf("output of reboot: %s", out)

	return nil
}
