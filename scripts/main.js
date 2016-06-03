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

function confirmPowerOff() {
    swal({
        title: "Turn system off?",
        text: "I'll miss you!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: false,
        closeOnCancel: false
    }, function(isConfirm) {
        if (isConfirm) {
            swal({
                title: "Powering off!",
                text: "The system will now shut down.",
                type: "success",
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            swal.close();
        }
    });
}

function showControlPage() {
    bootpage.switch("control-page");
}

function showHelpPage() {
    bootpage.switch("help-page");
}
