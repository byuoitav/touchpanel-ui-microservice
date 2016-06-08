package views

import (
	"net/http"
	"os"

	"github.com/labstack/echo"
)

func Main(context echo.Context) error {
	return context.Render(http.StatusOK, "buckets", os.Getenv("AUTH0_CALLBACK"))
}
