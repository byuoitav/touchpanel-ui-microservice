var version = "0.0.1";
var loadTime = 500;

function init() {
    displayVersion();
    bootpage.switch("idle-page");
}

function wakeSystem() {
    bootpage.switch("loading-page");

    setTimeout(function() {
        bootpage.fade("control-page");
    }, loadTime);
}

function displayVersion() {
    $(".version-number").text("version " + version);
}
