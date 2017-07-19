package events

var Building string
var Room string
var Name string
var dev bool

func Init() {

	go SubInit()
}
