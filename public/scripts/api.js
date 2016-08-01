function sonyTVPower() {
    var homeButton = {
        address: "10.66.9.6",
        command: "Home"
    };

    $.ajax({
        type: "POST",
        url: "http://localhost:8007/command",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: homeButton,
        success: sweetAlert("Yay!", "Command sent successfully!", "success"),
        contentType: "application/json; charset=utf-8"
    });
}
