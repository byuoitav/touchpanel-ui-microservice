package views

import (
	"log"
	"net/http"
	"os"

	"github.com/labstack/echo"
)

func Main(context echo.Context) error {
	log.Println("Returning page")

	// get hostname
	hostname, err := os.Hostname()
	if err != nil {
		log.Printf("couldn't get the hostname. error: %s, hostname: %s", err, hostname)
	}
	// temporary
	hostname = "ITB-1006"

	return context.Render(http.StatusOK, "main", hostname)
}
