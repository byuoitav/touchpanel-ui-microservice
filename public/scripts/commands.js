var outputDisplay; // defaults are the first valid options in the displays array
var outputAudio; // set in main.js
var displayBlanked = false;
var canGetVolume = false;
var sliderBuilt = false;
var selectedColor = "#a8a8a8";

function setDisplayOutput(device, e) {
	console.log("set display output to:", device);
	outputDisplay = device;

	// re-highlight the previous input
	if (displayInputs[outputDisplay].length != 0) {
		console.log("checking displayInputs[" + outputDisplay + "]. It's current value is " + displayInputs[outputDisplay]);
		// find the correct input button to re highlight
		$('.display-input-button').each(function(i, obj) {
			obj.style.backgroundColor = "white"; // set all to white
			if(obj.innerHTML == displayInputs[outputDisplay]) {
				console.log(obj);
				obj.style.backgroundColor = selectedColor;
			}
		});
	} else {
		$('.display-input-button').each(function(i, obj) {
	    	obj.style.backgroundColor = "white"; // set all to white
		});
	}

	// remove color from all display output buttons
	$('.display-output-button').each(function(i, obj) {
    	obj.style.backgroundColor = "white";
	});

	// change visual for active device
	e.style.backgroundColor = selectedColor;
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

	// re-highlight the previous input
	if (audioInputs[outputAudio].length != 0) {
		console.log("checking displayInputs[" + outputAudio + "]. It's current value is " + audioInputs[outputAudio]);
		// find the correct input button to re highlight
		$('.audio-input-button').each(function(i, obj) {
			obj.style.backgroundColor = "white"; // set all to white
			if(obj.innerHTML == audioInputs[outputAudio]) {
				console.log(obj);
				obj.style.backgroundColor = selectedColor;
			}
		});
	} else {
		$('.audio-input-button').each(function(i, obj) {
	    	obj.style.backgroundColor = "white"; // set all to white
		});
	}

	// remove color from all audio output buttons
	$('.audio-output-button').each(function(i, obj) {
    	obj.style.backgroundColor = "white";
	});

	// change visual for active device
	e.style.backgroundColor = selectedColor;
}

function switchDisplayInput(input, e) {
	console.log("switching display input of", outputDisplay, "to", input);

	// set previous input into the map
	console.log("mapped displayInputs[" + outputDisplay + "] to " + input);
	displayInputs[outputDisplay] = input;

	// remove color from all display input buttons
	$('.display-input-button').each(function(i, obj) {
    	obj.style.backgroundColor = "white";
	});

	// change visual for active device
	e.style.backgroundColor = selectedColor;

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
	e.style.backgroundColor = selectedColor;

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
		e.style.backgroundColor = selectedColor;
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

	var body;
	// if its a RPC devices, make a specific command
	if (roomData.configuration.name == "TecLite") {
		console.log("RPC Command");
		body = {
			rpcDevices: [{
				name: outputAudio,
				commands: [{
					name: "VolumeUp"
				}]
			}]
		};
	} else {
		console.log("Regular Command");
		body = {
			audioDevices: [{
				name: outputAudio,
				volume: volume
			}]
		};
	}

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

	var body;
	// if its a RPC devices, make a specific command
	if (roomData.configuration.name == "TecLite") {
		console.log("RPC Command");
		body = {
			rpcDevices: [{
				name: outputAudio,
				commands: [{
					name: "VolumeDown"
				}]
			}]
		};
	} else {
		console.log("Regular Command");
		body = {
			audioDevices: [{
				name: outputAudio,
				volume: volume
			}]
		};
	}

	quietPut(body);
}

function muteVolume() {
	console.log("mute/unmute volume");

	var body;
	// if its a RPC devices, make a specific command
	if (roomData.configuration.name == "TecLite") {
		console.log("RPC Command");
		body = {
			rpcDevices: [{
				name: outputAudio,
				commands: [{
					name: "Mute"
				}]
			}]
		};
		if (volume == "MUTED") {
			volume = previousVolume;
			body.rpcDevices[0].commands[0].name = "UnMute";
		} else {
			previousVolume = volume;
			volume = "MUTED";
		}

		console.log(body);
	} else {
		console.log("Regular Command");
		body = {
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
	quietPut(body);
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
