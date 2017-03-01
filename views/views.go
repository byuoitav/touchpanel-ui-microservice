package views

import (
	"log"
	"net/http"
	"os"

	"github.com/labstack/echo"
)

func Main(context echo.Context) error {
	log.Println("Returning page")

	if len(os.Getenv("PI_HOSTNAME")) > 0 { // get development hostname
		hostname, err := os.Getenv("PI_HOSTNAME")
		if err != nil {
			log.Printf("Couldn't get development hostname: %s", err)
		}
	} else { // get the real hostname
		hostname, err := os.Hostname()
		if err != nil {
			log.Printf("Couldn't get hostname: %s", err)
		}
	}

	return context.Render(http.StatusOK, "main", hostname)
}
