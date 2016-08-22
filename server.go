package main

import (
	"html/template"
	"log"

	"github.com/byuoitav/raspi-tp/helpers"
	"github.com/byuoitav/raspi-tp/views"
	"github.com/jessemillar/health"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/fasthttp"
	"github.com/labstack/echo/middleware"
)

func main() {
	templateEngine := &helpers.Template{
		Templates: template.Must(template.ParseGlob("public/*/*.html")),
	}

	port := ":8888"
	router := echo.New()
	router.Pre(middleware.RemoveTrailingSlash())
	router.SetRenderer(templateEngine)

	router.Use(middleware.CORS())

	router.Get("/health", health.Check)

	// Views
	router.Static("/*", "public")
	router.Get("/", views.Main)

	log.Println("Raspi TP is listening on " + port)
	router.Run(fasthttp.New(port))
}
