package handlers

import (
	"encoding/json"
	"log"
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
	Enabled bool   `json:"enabled"`
	APIHost string `json:"apihost"`
	Number  int    `json:"apinumber"`
}

var apiNum = 1

func GetAPI(context echo.Context) error {
	var ret apihost
	j, err := Getjson()
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	var c config
	tmp, _ := json.Marshal(j["apiconfig"])
	json.Unmarshal(tmp, &c)

	if c.Enabled {
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

	ret.Number = apiNum
	ret.Enabled = c.Enabled
	return context.JSON(http.StatusOK, ret)
}

func NextAPI(context echo.Context) error {
	j, err := Getjson()
	if err != nil {
		return context.JSON(http.StatusInternalServerError, err.Error())
	}

	apiNum++
	if apiNum > 10 {
		apiNum = 1
	}

	var c config
	tmp, _ := json.Marshal(j["apiconfig"])
	json.Unmarshal(tmp, &c)
	log.Printf("c: %v", c)

	valid := false
	for !valid {
		switch apiNum {
		case 1:
			if len(c.One) > 0 {
				valid = true
			}
		case 2:
			log.Printf("c.Two: %s", c.Two)
			if len(c.Two) > 0 {
				valid = true
			}
		case 3:
			log.Printf("c.Three: %s", c.Three)
			if len(c.Three) > 0 {
				valid = true
			}
		case 4:
			log.Printf("c.Four: %s", c.Four)
			if len(c.Four) > 0 {
				valid = true
			}
		case 5:
			if len(c.Five) > 0 {
				valid = true
			}
		case 6:
			if len(c.Six) > 0 {
				valid = true
			}
		case 7:
			if len(c.Seven) > 0 {
				valid = true
			}
		case 8:
			if len(c.Eight) > 0 {
				valid = true
			}
		case 9:
			if len(c.Nine) > 0 {
				valid = true
			}
		case 10:
			if len(c.Ten) > 0 {
				valid = true
			}
		}

		if !valid {
			log.Printf("No api config #%v, continuing to next", apiNum)
			apiNum++
			if apiNum > 10 {
				apiNum = 1
			}
		}
	}

	return GetAPI(context)
}
