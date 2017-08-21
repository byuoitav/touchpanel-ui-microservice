package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/labstack/echo"
)

type config struct {
	Enabled bool   `json:"enabled"`
	One     string `json:"1"`
	Two     string `json:"2"`
	Three   string `json:"3"`
	Four    string `json:"4"`
	Five    string `json:"5"`
	Six     string `json:"6"`
	Seven   string `json:"7"`
	Eight   string `json:"8"`
	Nine    string `json:"9"`
	Ten     string `json:"10"`
}

type apihost struct {
	APIHost string `json:"apihost"`
}

var apiNum = 1

func GetAPI(context echo.Context) error {
	var ret apihost
	//	GetJSON(context)

	var c config
	tmp, _ := json.Marshal(configcache["apiconfig"])
	json.Unmarshal(tmp, &c)

	if c.Enabled {
		//		api := strconv.Itoa(apiNum)
		switch apiNum {
		case 1:
			ret.APIHost = c.One
		case 2:
			ret.APIHost = c.Two
		case 3:
			ret.APIHost = c.Three
		case 4:
			ret.APIHost = c.Four
		case 5:
			ret.APIHost = c.Five
		case 6:
			ret.APIHost = c.Six
		case 7:
			ret.APIHost = c.Seven
		case 8:
			ret.APIHost = c.Eight
		case 9:
			ret.APIHost = c.Nine
		case 10:
			ret.APIHost = c.Ten
		}
	} else {
		hn := os.Getenv("PI_HOSTNAME")
		ret.APIHost = hn
	}

	return context.JSON(http.StatusOK, ret)
}

func NextAPI(context echo.Context) error {
	apiNum++
	return GetAPI(context)
}
