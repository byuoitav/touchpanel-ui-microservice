package handlers

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/byuoitav/central-event-system/messenger"
	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/touchpanel-ui-microservice/helpers"
	"github.com/labstack/echo"
)

func GetHostname(context echo.Context) error {
	hostname, err := os.Hostname()
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	return context.JSON(http.StatusOK, hostname)
}

func GetPiHostname(context echo.Context) error {
	hostname := os.Getenv("SYSTEM_ID")
	return context.JSON(http.StatusOK, hostname)
}

func GetDeviceInfo(context echo.Context) error {
	di, err := helpers.GetDeviceInfo()
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	return context.JSON(http.StatusOK, di)
}

func Reboot(context echo.Context) error {
	log.Printf("[management] Rebooting pi")
	http.Get("http://localhost:7010/reboot")
	return nil
}

func GetDockerStatus(context echo.Context) error {
	log.Printf("[management] Getting docker status")
	resp, err := http.Get("http://localhost:7010/dockerStatus")
	log.Printf("docker status response: %v", resp)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	return context.String(http.StatusOK, string(body))
}

// GenerateHelpFunction generates an echo handler that handles help requests.
func GenerateHelpFunction(value string, messenger *messenger.Messenger) func(ctx echo.Context) error {
	return func(ctx echo.Context) error {
		deviceInfo := events.GenerateBasicDeviceInfo(os.Getenv("SYSTEM_ID"))

		// send an event requesting help
		event := events.Event{
			GeneratingSystem: deviceInfo.DeviceID,
			Timestamp:        time.Now(),
			EventTags: []string{
				events.Alert,
			},
			TargetDevice: deviceInfo,
			AffectedRoom: events.GenerateBasicRoomInfo(deviceInfo.RoomID),
			Key:          "help-request",
			Value:        value,
			User:         ctx.RealIP(),
			Data:         nil,
		}

		log.Printf("Sending event to %s help. (event: %+v)", value, event)
		messenger.SendEvent(event)

		return ctx.String(http.StatusOK, fmt.Sprintf("Help has been %sed", value))
	}
}
