function sonyTVPower() {
    $.ajax({
        type: "POST",
        url: "localhost:8007/command",
        data: {
            address: "10.66.9.6",
            command: "TvPower"
        },
        success: swal("Command sent.")
    });
}
