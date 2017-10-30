package uiconfig

import (
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo"
)

type APIHost struct {
	Hostname string `json:"hostname"`
}

var apiNum = 0

func GetAPI(context echo.Context) error {
	config, err := getUIConfig()
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

func GetUIConfig(context echo.Context) error {
	j, err := getUIConfig()
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	return context.JSON(http.StatusOK, j)
}

func GetUIPath(context echo.Context) error {
	config, err := getUIConfig()
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	hostname := os.Getenv("PI_HOSTNAME")
	for _, panel := range config.Panels {
		if strings.EqualFold(hostname, panel.Hostname) {
			return context.JSON(http.StatusOK, &APIHost{Hostname: panel.UIPath})
		}
	}

	return context.JSON(http.StatusInternalServerError, &APIHost{Hostname: "/404.html"})
}
