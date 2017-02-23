var version = "1.0.2";
var loadTime = 500;
var swalTimeout = 1000;
var previousVolume = 0; // Used for remembering the last volume value when muted
var volume = 0;

// need to be dynamically set
var url;
var roomData;
var devices = [];

function init() {
    displayVersion();
}

function getRoom() {
    var hostname = document.getElementById('hostname').innerHTML;
    hostname = hostname.replace(/\s+/g, '');    // remove white space
    console.log("hostname =", hostname);
    var split = hostname.split('-');

    url = "http://localhost:8000/buildings/" + split[0] + "/rooms/" + split[1];
    console.log("url for this room: ", url);

    getAllData();
    getVolume();

    // get devices, put them into an array
    for(i in roomData.devices) {
        devices.push(roomData.devices[i]);
    }

    for(i in devices) {
        console.log(devices[i]);
    }
}

function getAllData() {
    // get the all room information
    return $.ajax({
        type: "GET",
        url: url,
        async: false,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        success: function(data) {
            console.log("returning room data: ", data);
            roomData = data;
        },
        contentType: "application/json; charset=utf-8"
    });
}

function setup() {
}

function pleaseWait() {
    swal({
        title: "Please Wait",
        text: "Command sent successfully.",
        timer: swalTimeout,
        showConfirmButton: false
    });
}

function getVolume() {
    $.ajax({
        type: "GET",
        url: "http://localhost:8000/buildings/ITB/rooms/1001D",
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        success: function(data) {
            console.log("Returned volume data: ", data);

            var devices = data.devices;
            for (var i = 0; i < devices.length; i++) {
                if (devices[i].name == "D1") {
                    volume = devices[i].volume;
                    showVolume();
                }
            }
        },
        contentType: "application/json; charset=utf-8"
    });
}

function wakeSystem() {
    $("#idle-splash").hide();
    $("#loading-splash").show();

    setTimeout(function() {
        $("#loading-splash").fadeOut();
        getRoom();
        // setup();

        // if (window.location.hash) { // If we're refreshing a page or opening a bookmark, open the proper tab
        // var hashPage = window.location.hash.substring(1, window.location.hash.length);
        // bootpage.show(hashPage, updateActiveTab);
        // } else {
        bootpage.show("room-page", updateActiveTab);
        // }
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
                timer: swalTimeout,
                showConfirmButton: false
            });

            setTimeout(function() {
                window.location = "/"; // Reload the page without hashes
            }, swalTimeout);
        } else {
            swal.close();
        }
    });
}

function showVolume() {
    if (volume == "MUTED") {
        $("#volume-level").text(volume);
    } else {
        $("#volume-level").text(volume + "%");
    }
}

function updateActiveTab() {
    $("#sony-tv-tab").removeClass("active");
    $("#room-tab").removeClass("active");
    $("#epson-projector-tab").removeClass("active");

    var currentTab = bootpage.currentPage.substring(0, bootpage.currentPage.length - 5);

    $("#" + currentTab + "-tab").addClass("active");
}
