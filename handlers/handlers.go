package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/byuoitav/touchpanel-ui-microservice/events"
	"github.com/labstack/echo"
)

func PublishEvent(context echo.Context) error {
	var event json.RawMessage
	err := context.Bind(&event)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	err = events.Publish(event)
	if err != nil {
		log.Printf("error: %s", err.Error())
	}

	return context.JSON(http.StatusOK, event)
}
