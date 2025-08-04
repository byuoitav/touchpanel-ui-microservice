package uiconfig

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/byuoitav/common/status"
	"github.com/gin-gonic/gin"
)

type APIHost struct {
	Hostname string `json:"hostname"`
}

var apiNum = 0
var version = "0"

func init() {
	version, _ = status.GetMicroserviceVersion()
}

func GetAPI(c *gin.Context) {
	config, err := getUIConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	if len(config.Api) <= apiNum {
		apiNum = 0
	}
	c.JSON(http.StatusOK, &APIHost{Hostname: config.Api[apiNum]})
}

func NextAPI(c *gin.Context) {
	apiNum++
	GetAPI(c)
}

func GetUIConfig(c *gin.Context) {
	j, err := getUIConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, j)
}

func GetThemeConfig(c *gin.Context) {
	j, err := getThemeConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, j)
}

func GetLogo(c *gin.Context) {
	j, err := getLogo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	c.Data(http.StatusOK, "image/svg+xml", j)
}

func GetUIPath(c *gin.Context) {
	config, err := getUIConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}
	hostname := os.Getenv("SYSTEM_ID")
	for _, panel := range config.Panels {
		if strings.EqualFold(hostname, panel.Hostname) {
			str := GenRandString(8)
			queryString := fmt.Sprintf("?%s=%s", url.QueryEscape(version), url.QueryEscape(str))
			c.JSON(http.StatusOK, &APIHost{Hostname: panel.UIPath + queryString})
			return
		}
	}
	c.JSON(http.StatusInternalServerError, &APIHost{Hostname: "/404.html"})
}
