var outputDevice = "room";
var displayBlanked = false;

function setOutputDevice(device) {
    console.log(device);
    outputDevice = device;
}

function switchInput(input) {
    console.log("Pressed", outputDevice, input);

    var body = {};

    if (outputDevice == "room") {
        body = {
            currentVideoInput: input
        };
    } else {
        body = {
            displays: [{
                name: outputDevice,
                input: input
            }]
        };
    }

    console.log(body);

    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1001D",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: JSON.stringify(body),
        success: pleaseWait(),
        contentType: "application/json; charset=utf-8"
    });
}

function blankDisplay() {
    console.log("Pressed");

    var body = {};

    console.log(eval("devicesList." + outputDevice));

    if (eval("devicesList." + outputDevice).blanked) {
        eval("devicesList." + outputDevice).blanked = false;
    } else {
        eval("devicesList." + outputDevice).blanked = true;
    }

    if (outputDevice == "room") {
        body = {
            blanked: eval("devicesList." + outputDevice).blanked
        };
    } else {
        body = {
            displays: [{
                name: outputDevice,
                blanked: eval("devicesList." + outputDevice).blanked
            }]
        };
    }

    console.log(body);

    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1001D",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: JSON.stringify(body),
        success: pleaseWait(),
        contentType: "application/json; charset=utf-8"
    });

    showVolume();
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
            name: "D1",
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
        contentType: "application/json; charset=utf-8"
    });

    showVolume();
}

function decreaseVolume() {
    if (volume == "MUTED") {
        volume = previousVolume;
    }

    if (volume > 0) {
        volume -= volumeIncrement;
    }

    console.log("Pressed");

    var body = {
        audioDevices: [{
            name: "D1",
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
        contentType: "application/json; charset=utf-8"
    });

    showVolume();
}

function muteVolume() {
    console.log("Pressed");

    var body = {
        audioDevices: [{
            name: "D1",
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
        contentType: "application/json; charset=utf-8"
    });

    showVolume();
}

function powerOn() {
    if (outputDevice == "room") {
        body = {
            power: "on"
        };
    } else {
        body = {
            displays: [{
                name: outputDevice,
                power: "on"
            }]
        };
    }

    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1001D",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: JSON.stringify(body),
        success: pleaseWait(),
        contentType: "application/json; charset=utf-8"
    });
}

function powerOff() {
    if (outputDevice == "room") {
        body = {
            power: "standby"
        };
    } else {
        body = {
            displays: [{
                name: outputDevice,
                power: "standby"
            }]
        };
    }

    $.ajax({
        type: "PUT",
        url: "http://localhost:8000/buildings/ITB/rooms/1001D",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        data: JSON.stringify(body),
        success: pleaseWait(),
        contentType: "application/json; charset=utf-8"
    });
}
