package views

import (
	"net/http"

	"github.com/labstack/echo"
)

func Main(context echo.Context) error {
	return context.Render(http.StatusOK, "main", "")
}
