package handlers

import (
	"net/http"

	"github.com/labstack/echo"
)

func PublishEvent(context echo.Context) error {
	var event string
	err := context.Bind(&event)
	if err != nil {
		return context.JSON(http.StatusBadRequest, err.Error())
	}

	return context.JSON(http.StatusOK, event)
}
