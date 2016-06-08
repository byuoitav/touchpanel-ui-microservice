package helpers

import (
	"html/template"
	"io"

	"github.com/labstack/echo"
)

type Template struct {
	Templates *template.Template
}

func (templater *Template) Render(writer io.Writer, name string, data interface{}, context echo.Context) error {
	return templater.Templates.ExecuteTemplate(writer, name, data)
}
