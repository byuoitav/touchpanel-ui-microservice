package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/byuoitav/central-event-system/messenger"
	"github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/touchpanel-ui-microservice/db"
	"github.com/byuoitav/touchpanel-ui-microservice/helpers"
	"github.com/byuoitav/touchpanel-ui-microservice/structs"
	"github.com/gin-gonic/gin"
)

func GetHostname(context *gin.Context) {
	hostname, err := os.Hostname()
	if err != nil {
		context.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	context.JSON(http.StatusOK, hostname)
}

func GetPiHostname(context *gin.Context) {
	hostname := os.Getenv("SYSTEM_ID")
	context.JSON(http.StatusOK, hostname)
}

func GetDeviceInfo(context *gin.Context) {
	di, err := helpers.GetDeviceInfo()
	if err != nil {
		context.JSON(http.StatusBadRequest, err.Error())
		return
	}
	context.JSON(http.StatusOK, di)
}

func Reboot(context *gin.Context) {
	log.Printf("[management] Rebooting pi")
	req, _ := http.NewRequest(http.MethodPut, "http://localhost:10000/device/reboot", nil)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		context.String(http.StatusInternalServerError, err.Error())
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode/100 == 2 {
		context.String(http.StatusOK, "rebooting")
		return
	}
	context.String(http.StatusInternalServerError, "unable to reboot")
}

// GenerateHelpFunction generates a gin handler that handles help requests.
func GenerateHelpFunction(value string, messenger *messenger.Messenger) func(ctx *gin.Context) {
	return func(ctx *gin.Context) {
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
			User:         ctx.RemoteIP(),
			Data:         nil,
		}

		log.Printf("Sending event to %s help. (event: %+v)", value, event)
		messenger.SendEvent(event)

		ctx.String(http.StatusOK, fmt.Sprintf("Help has been %sed", value))
	}
}

func GetControlKey(c *gin.Context) {
	room := c.Param("room")
	group := c.Param("controlGroup")
	keyServiceAddr := os.Getenv("KEY_SERVICE_ADDR")
	fmt.Println("Key service address:", keyServiceAddr)
	fmt.Println("Room:", room, "Group:", group)
	if keyServiceAddr == "" {
		c.Status(http.StatusInternalServerError)
		return
	}

	url := fmt.Sprintf("https://%s/%s %s/getControlKey", keyServiceAddr, room, group)
	fmt.Println("Requesting control key from:", url)
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		c.String(http.StatusInternalServerError, fmt.Sprintf("unable to build request: %s", err))
		return
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.String(http.StatusInternalServerError, fmt.Sprintf("unable to make request: %s", err))
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.String(http.StatusInternalServerError, fmt.Sprintf("unable to read response: %s", err))
		return
	}

	if resp.StatusCode/100 != 2 {
		c.String(http.StatusInternalServerError, fmt.Sprintf("error from key service: %s", body))
		return
	}

	var key struct {
		ControlKey string `json:"ControlKey"`
	}

	if err := json.Unmarshal(body, &key); err != nil {
		c.String(http.StatusInternalServerError, fmt.Sprintf("unable to parse response: %s", err))
		return
	}

	c.JSON(http.StatusOK, key)
}

func HandleCameraControl(logger *slog.Logger, ctx *gin.Context) {
	// Bind the incoming request body to the CameraControlRequest struct
	var request structs.CameraControlRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		logger.Error("Invalid request", slog.Any("error", err))
		ctx.JSON(http.StatusBadRequest, "Invalid request")
		return
	}

	logger.Debug("Camera control request", slog.Any("request", request))

	// Create the GET request to the specified URL
	req, err := http.NewRequest(http.MethodGet, request.URL, nil)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, "Error creating GET request to camera")
		return
	}

	// Add the cookie to the request
	req.AddCookie(&http.Cookie{
		Name:  "control-key",
		Value: request.Code,
	})

	// Send the GET request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, "Error doing GET request to camera")
		return
	}
	defer resp.Body.Close()

	// Respond to the frontend
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, "Error reading response body")
		return
	}

	ctx.JSON(resp.StatusCode, fmt.Sprintf("Response: %s, Response Body: %s", resp.Status, string(body)))
}

// GetHelpSchedule returns a help/support schedule, resolving building-specific
// schedules and following the override chain. The ?id= query param bypasses
// building lookup and is useful for testing/debugging.
func GetHelpSchedule(ctx *gin.Context) {
	id := ctx.Query("id")

	if id == "" {
		// Derive building ID from SYSTEM_ID (format: BLDG-ROOM-CP1)
		systemID := os.Getenv("SYSTEM_ID")
		if parts := strings.SplitN(systemID, "-", 3); len(parts) >= 1 && parts[0] != "" {
			building, err := db.GetDB().GetBuilding(parts[0])
			if err != nil {
				log.Printf("[helpSchedule] failed to get building %s: %v", parts[0], err)
			} else if building.SupportSchedule != "" {
				id = building.SupportSchedule
				log.Printf("[helpSchedule] using building-specific schedule %q for building %s", id, parts[0])
			} else {
				log.Printf("[helpSchedule] no support-schedule set for building %s, using default", parts[0])
			}
		}
	} else {
		log.Printf("[helpSchedule] using explicit schedule id %q from query param", id)
	}

	if id == "" {
		id = "default-schedule"
	}

	schedule, err := resolveSchedule(id)
	if err != nil {
		ctx.String(http.StatusInternalServerError, fmt.Sprintf("failed to get help schedule %s: %v", id, err))
		return
	}

	log.Printf("[helpSchedule] resolved schedule: %q (requested: %s)", schedule.ID, id)
	ctx.JSON(http.StatusOK, schedule)
}

// resolveSchedule fetches a schedule by ID and follows the "over-ride" chain
// until it finds a schedule with no valid override. If an override references a
// non-existent schedule, the last valid schedule is returned. A visited set
// prevents infinite loops from circular override references.
func resolveSchedule(id string) (structs.HelpSchedule, error) {
	visited := make(map[string]bool)
	var last structs.HelpSchedule

	for current := id; current != ""; {
		if visited[current] {
			log.Printf("[helpSchedule] cycle detected in override chain at %q, using last valid schedule %q", current, last.ID)
			return last, nil
		}
		visited[current] = true

		schedule, err := db.GetDB().GetHelpSchedule(current)
		if err != nil {
			if last.ID != "" {
				log.Printf("[helpSchedule] override %q not found (from %s), using last valid schedule: %v", current, last.ID, err)
				return last, nil
			}
			return schedule, err
		}

		last = schedule

		if schedule.Override == "" {
			log.Printf("[helpSchedule] schedule %q has no override, using it", current)
			return schedule, nil
		}
		log.Printf("[helpSchedule] schedule %q overridden by %q, following chain", current, schedule.Override)
		current = schedule.Override
	}

	return last, nil
}
