package uiconfig

import (
	"net/http"

	"github.com/labstack/echo"
)

type APIHost struct {
	Hostname string `json:"hostname"`
}

var apiNum = 0

func GetAPI(context echo.Context) error {
	config, err := GetUIConfig()
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	if len(config.Api) <= apiNum {
		apiNum = 0
	}

	return context.JSON(http.StatusOK, &APIHost{Hostname: config.Api[apiNum]})
}

func NextAPI(context echo.Context) error {
	apiNum++

	return GetAPI(context)
}
