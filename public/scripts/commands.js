var outputDevice = "D1";

function setOutPutDevice(device) {
    outputDevice = device;
}

function switchInput(input) {
    console.log("Pressed");

    var body = {
        currentVideoInput: input,
        displays: [{
            name: "D1",
            power: "on",
            blanked: false
        }]
    };

    console.log(body);

    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1001D",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: JSON.stringify(body),
        success: sweetAlert("Yay!", "Command sent successfully!", "success"),
        contentType: "application/json; charset=utf-8"
    });
}

var volumeIncrement = 1;

function increaseVolume() {
    if (volume == "MUTED") {
        volume = previousVolume;
    }

    if (volume < 100) {
        volume += volumeIncrement;
    }

    console.log("Pressed");

    var body = {
        audioDevices: [{
            volume: volume
        }]
    };

    console.log(body);

    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1001D",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: JSON.stringify(body),
        // success: sweetAlert("Yay!", "Command sent successfully!", "success"),
        contentType: "application/json; charset=utf-8"
    });

    showVolume();
}

function increaseVolume() {
    if (volume == "MUTED") {
        volume = previousVolume;
    }

    if (volume > 0) {
        volume -= volumeIncrement;
    }

    console.log("Pressed");

    var body = {
        audioDevices: [{
            volume: volume
        }]
    };

    console.log(body);

    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1001D",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: JSON.stringify(body),
        // success: sweetAlert("Yay!", "Command sent successfully!", "success"),
        contentType: "application/json; charset=utf-8"
    });

    showVolume();
}

function muteVolume() {
    console.log("Pressed");

    var body = {
        audioDevices: [{
            muted: true
        }]
    };

    if (volume == "MUTED") {
        volume = previousVolume;
        body.audioDevices[0].muted = false;
    } else {
        previousVolume = volume;
        volume = "MUTED";
    }

    console.log(body);

    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1001D",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: JSON.stringify(body),
        // success: sweetAlert("Yay!", "Command sent successfully!", "success"),
        contentType: "application/json; charset=utf-8"
    });

    showVolume();
}

// ------------------------------------------------------
// OLD API COMMANDS BELOW
// ------------------------------------------------------

function sonyTVPowerOn() {
    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1110",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: {
            "displays": [{
                "name": "dp1",
                "power": "on"
            }]
        },
        success: sweetAlert("Yay!", "Command sent successfully!", "success"),
        contentType: "application/json; charset=utf-8"
    });
}

function sonyTVPowerOff() {
    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1110",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: {
            "displays": [{
                "name": "dp1",
                "power": "standby"
            }]
        },
        success: sweetAlert("Yay!", "Command sent successfully!", "success"),
        contentType: "application/json; charset=utf-8"
    });
}

// function switchInput(inputName) {
//     var inputBody = {
//         "currentVideoInput": inputName
//     };
//
//     $.ajax({
//         type: "PUT",
//         url: "http://localhost:8000/buildings/ITB/rooms/1110",
//         headers: {
//             'Access-Control-Allow-Origin': '*'
//         },
//         data: JSON.stringify(inputBody),
//         success: sweetAlert("Yay!", "Command sent successfully!", "success"),
//         contentType: "application/json; charset=utf-8"
//     });
// }
// /     });
// }
