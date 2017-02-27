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
		log.Printf("couldn't get the hostname. error: %s", err)
	}
	// temporary
	hostname = "ITB-1106"

	return context.Render(http.StatusOK, "main", hostname)
}
