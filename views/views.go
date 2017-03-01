package views

import (
	"log"
	"net/http"
	"os"

	"github.com/labstack/echo"
)

func Main(context echo.Context) error {
	log.Println("Returning page")

	hostname, err := os.Hostname()
	if err != nil {
		log.Printf("Couldn't get hostname: %s", err)
	}

	// get the development hostname instead of the real one if it's set
	if len(os.Getenv("PI_HOSTNAME")) > 0 {
		hostname = os.Getenv("PI_HOSTNAME")
	}

	return context.Render(http.StatusOK, "main", hostname)
}
