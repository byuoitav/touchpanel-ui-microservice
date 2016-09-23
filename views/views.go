package views

import (
	"log"
	"net/http"

	"github.com/labstack/echo"
)

func Main(context echo.Context) error {
	log.Println("Returning page")

	return context.Render(http.StatusOK, "main", "")
}
