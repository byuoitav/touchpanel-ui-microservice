var outputDevice = "D1";
var displayBlanked = false;

function setOutputDevice(device) {
    console.log(device);
    outputDevice = device;
}

function pleaseWait() {
    swal({
        title: "Please Wait",
        text: "Command sent successfully.",
        timer: 3000,
        showConfirmButton: false
    });
}

function switchInput(input) {
    console.log("Pressed");

    var body = {
        currentVideoInput: input
    };

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
    if (displayBlanked) {
        displayBlanked = false;
    } else {
        displayBlanked = true;
    }

    if (volume < 100) {
        volume += volumeIncrement;
    }

    console.log("Pressed");

    var body = {
        displays: [{
            name: outputDevice,
            blanked: displayBlanked
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
            name: outputDevice,
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
            name: outputDevice,
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
            name: outputDevice,
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
    var body = {
        displays: [{
            name: outputDevice,
            power: "on"
        }]
    };

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
    var body = {
        displays: [{
            name: outputDevice,
            power: "standby"
        }]
    };

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
