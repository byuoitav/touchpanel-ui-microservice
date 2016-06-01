var version = "0.0.1";
var tracer = new AniTrace();

function init() {
    tracer.trace("loading-animation", 0, 2000, "easeInOutQuad");
    displayVersion();
}

function displayVersion() {
    $("#version-number").text("version " + version);
}
