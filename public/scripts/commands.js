var outputDisplay; // defaults are the first valid options in the displays array
var outputAudio; // set in main.js
var displayBlanked = false;
var canGetVolume = false;
var sliderBuilt = false;

function setDisplayOutput(device, e) {
	console.log("set display output to:", device);
	outputDisplay = device;

	// remove color from all display output buttons
	$('.display-output-button').each(function(i, obj) {
    	obj.style.backgroundColor = "white";
	});

	// change visual for active device
	e.style.backgroundColor = "#a8a8a8";
}

function setAudioOutput(device, e) {
	console.log("set audio output to:", device);
	outputAudio = device;

	// if output device isn't an RPC device, create a slider to control it with
	for (var i in devices) {
		if (devices[i].name == outputAudio) {
			for (var j in devices[i].roles) {
				for (var k in devices[i].commands) {
					if (devices[i].commands[k].name == "SetVolume") {
						canGetVolume = true;
						break;
					}
				}

				if (devices[i].roles[j] == "AudioOut" && canGetVolume) {
					if (!sliderBuilt) {
						slider = document.createElement("INPUT");
						slider.setAttribute("id", "slider");
						slider.setAttribute("type", "range");
						// edit volume dynamically as the slider changes
						slider.onchange = function() {
							setVolume(slider)
						};

						console.log("adding a slider");
						document.getElementById("vol-slider").appendChild(slider);
						sliderBuilt = true;
					}

					$("#vol-up").hide();
					$("#vol-down").hide();
					$("#vol-slider").show();
				} else {
					// change it back to buttons if it's RPC
					$("#vol-slider").hide();
					$("#vol-up").show();
					$("#vol-down").show();
				}
			}
		}
	}

	// remove color from all audio output buttons
	$('.audio-output-button').each(function(i, obj) {
    	obj.style.backgroundColor = "white";
	});

	// change visual for active device
	e.style.backgroundColor = "#a8a8a8";
}

function switchDisplayInput(input, e) {
	console.log("switching display input of", outputDisplay, "to", input);

	// remove color from all display input buttons
	$('.display-input-button').each(function(i, obj) {
    	obj.style.backgroundColor = "white";
	});

	// change visual for active device
	e.style.backgroundColor = "#a8a8a8";

	var body = {};

	body = {
		displays: [{
			name: outputDisplay,
			input: input
		}],
	};
	put(body);
}

function switchAudioInput(input, e) {
	console.log("switching audio input of", outputAudio, "to", input);

	// remove color from all display output buttons
	$('.audio-input-button').each(function(i, obj) {
    	obj.style.backgroundColor = "white";
	});

	// change visual for active device
	e.style.backgroundColor = "#a8a8a8";

	var body = {};

	body = {
		audioDevices: [{
			name: outputAudio,
			input: input
		}]
	};
	put(body);
}

function blankDisplay(e) {
	console.log("blank/unblank display");

	var body = {};

	body = {
		displays: [{
			name: outputDisplay,
			blanked: true
		}]
	};

	if (displayBlanked == true) {
		body.displays[0].blanked = false;
		displayBlanked = false;
		// set button to say "Blank"
		e.innerHTML = "Blank";
		e.style.backgroundColor = "white";
	} else {
		displayBlanked = true;
		// set button to say "Unblank"
		e.innerHTML = "Unblank";
		e.style.backgroundColor = "#a8a8a8";
	}
	put(body);
}

var volumeIncrement = 1;

function increaseVolume() {
	if (volume == "MUTED") {
		volume = previousVolume;
	}

	if (volume < 100) {
		volume += volumeIncrement;
	}

	console.log("pressed volume up");

	var body = {
		audioDevices: [{
			name: outputAudio,
			volume: volume
		}]
	};
	quietPut(body);
}

function decreaseVolume() {
	if (volume == "MUTED") {
		volume = previousVolume;
	}

	if (volume > 0) {
		volume -= volumeIncrement;
	}

	console.log("pressed volume down");

	var body = {
		audioDevices: [{
			name: outputAudio,
			volume: volume
		}]
	};
	quietPut(body);
}

function muteVolume() {
	console.log("mute/unmute volume");

	var body = {
		audioDevices: [{
			name: outputAudio,
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
	put(body);
}

function setVolume(e) {
	var vol = document.getElementById("slider").value;
	if (volume == "MUTED") {
		volume = previousVolume;
	} else {
		volume = vol;
	}

	console.log("moved volume slider to", vol);
	e.style.background = 'linear-gradient(to right, blue, #527090 ' + vol + '%, #e0e0e0)';

	var body = {
		audioDevices: [{
			name: outputAudio,
			volume: parseInt(vol)
		}]
	};
	quietPut(body);
}

function powerOnRoom() {
	console.log("turning room on");
	var body = {
		power: "on",
		displays: [{
			name: outputDisplay,
			power: "on",
		}]
	};

	// make it take longer to turn on so that input can change
	$.ajax({
		type: "PUT",
		url: url,
		async: false,
		headers: {
			'Access-Control-Allow-Origin': '*'
		},
		data: JSON.stringify(body),
		contentType: "application/json; charset=utf-8"
	});
	// quietPut(body);
}

function powerOffRoom() {
	console.log("powering off room");
	// just to power down one (the current) device
	var body = {
		power: "standby"
	};

	quietPut(body);
}

function put(body) {
	console.log("put", body);
	$.ajax({
		type: "PUT",
		url: url,
		headers: {
			'Access-Control-Allow-Origin': '*'
		},
		data: JSON.stringify(body),
		success: pleaseWait(),
		contentType: "application/json; charset=utf-8"
	});
}

function quietPut(body) {
	console.log("quietPut", body);
	$.ajax({
		type: "PUT",
		url: url,
		headers: {
			'Access-Control-Allow-Origin': '*'
		},
		data: JSON.stringify(body),
		contentType: "application/json; charset=utf-8"
	});
}
