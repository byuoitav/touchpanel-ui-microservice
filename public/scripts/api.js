function sonyTVPower() {
    var homeButton = {
        address: "10.66.9.6",
        command: "Home"
    };

    $.ajax({
        type: "POST",
        url: "localhost:8007/command",
        data: homeButton,
        success: swal("Command sent."),
        contentType: "application/json; charset=utf-8"
    });
}
