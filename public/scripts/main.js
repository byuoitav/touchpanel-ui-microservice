var version = "0.9.4";
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
	hostname = hostname.replace(/\s+/g, ''); // remove white space
	console.log("hostname =", hostname);
	var split = hostname.split('-');

	url = "http://localhost:8000/buildings/" + split[0] + "/rooms/" + split[1];
	console.log("url for this room: ", url);

	getAllData();
	// getVolume();

	// get devices, put them into an array
	for (i in roomData.devices) {
		devices.push(roomData.devices[i]);
	}

	// for(i in devices) {
	//     console.log(devices[i]);
	// }
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
	console.log("setup()");
	var numOfDisplayIns = 0;
	var numOfDisplayOuts = 0;
	var numOfAudioIns = 0;
	var numOfAudioOuts = 0;

	// if there are no devices
	if (devices.length == 0) {
		console.log("no devices found");
		$("#vol-slider").hide();
		$(".blank").hide();
		document.getElementById("volume-level").innerHTML = ":(";

		swal({
			title: "no devices found",
			text: "please contact a CSR for help",
			showConfirmButton: false,
			type: "warning",
		});
	}

	for (var i in devices) {
		for (var j in devices[i].roles) {
			if (devices[i].roles[j] == "VideoOut") {
				numOfDisplayOuts++;
				console.log("devices[" + i + "](" + devices[i].name + ") is a display *output* device, building a button for it!");
				// if it is an output, create a button on the displays page for it
				var button = document.createElement("button");

				// https://www.w3schools.com/js/js_htmldom_document.asp to fix onclick
				// button.innerHTML = "type="button" class="output-button" onclick="switchInput('HDMIIn')"" // edit function call
				button.type = "button";
				button.className = "display-output-button";
				var name = devices[i].name;
				button.onclick = (function(name) {
					return function() {
						setDisplayOutput(name);
					}
				})(name);
				button.innerHTML = name;
				document.getElementById("displays").appendChild(button);
				// set default, turn on first device
				if (numOfDisplayOuts == 1) {
					setDisplayOutput(name);
					powerOnRoom();
				}
			} else if (devices[i].roles[j] == "VideoIn") {
				numOfDisplayIns++;
				console.log("devices[" + i + "](" + devices[i].name + ") is an display *input* device, building a button for it!");

				//create a button for each input
				var button = document.createElement("button");
				button.type = "button";
				button.className = "display-input-button";
				var name = devices[i].name;
				button.onclick = (function(name) {
					return function() {
						switchDisplayInput(name);
					}
				})(name);
				button.innerHTML = name;
				document.getElementById("display-inputs").appendChild(button);
			} else if (devices[i].roles[j] == "AudioOut") {
				numOfAudioOuts++;
				console.log("devices[" + i + "](" + devices[i].name + ") is a audio *output* device, building a button for it!");

				//create a button for each input
				var button = document.createElement("button");
				button.type = "button";
				button.className = "audio-output-button";
				var name = devices[i].name;
				// need to create a switchAudioOutput function?
				button.onclick = (function(name) {
					return function() {
						setAudioOutput(name);
					}
				})(name);
				button.innerHTML = name;
				document.getElementById("audio-outs").appendChild(button);

				// set default (initial) volume (only for first audio device)
				if (numOfAudioOuts == 1 && canGetVolume) {
					// volume = devices[i].volume;
					volume = 0; // temporary, need a way to get the volume

					// hack to get the current volume
					$.ajax({
						type: "GET",
						url: "http://localhost:8004/" + devices[i].address + "/volume/get",
						async: false,
						headers: {
							'Access-Control-Allow-Origin': '*'
						},
						success: function(data) {
							console.log("setting volume to", data);
							volume = data;
							slider.setAttribute("value", volume);
						},
						contentType: "application/json; charset=utf-8"
					});
				}

				setAudioOutput(name);
			} else if (devices[i].roles[j] == "AudioIn") {
				numOfAudioIns++;
				console.log("devices[" + i + "](" + devices[i].name + ") is a audio *output* device, building a button for it!");
				// if it is an output, create a button on the displays page for it
				var button = document.createElement("button");

				//create a button for each input
				button.type = "button";
				button.className = "audio-input-button";
				var name = devices[i].name;
				button.onclick = (function(name) {
					return function() {
						switchAudioInput(name);
					}
				})(name);
				button.innerHTML = name;
				document.getElementById("audio-ins").appendChild(button);
			} else {
				// console.log("my role is " + devices[i].roles[j] + ". I don't get a button :( my name is: " + devices[i].name);
			}
		}
	}

	// update width of display buttons
	var newMargin = 5 / numOfDisplayOuts;
	var displayOutputButtons = document.querySelectorAll(".display-output-button");
	for (var i = 0; i < displayOutputButtons.length; i++) {
		displayOutputButtons[i].style.marginLeft = newMargin + "%";
		displayOutputButtons[i].style.marginRight = newMargin + "%";
	}

	// update width of display-input buttons
	newMargin = 5 / numOfDisplayIns;
	var displayInputButtons = document.querySelectorAll(".display-input-button");
	for (var i = 0; i < displayInputButtons.length; i++) {
		displayInputButtons[i].style.marginLeft = newMargin + "%";
		displayInputButtons[i].style.marginRight = newMargin + "%";
	}

	// update width of audio-output buttons
	newMargin = 5 / numOfAudioOuts;
	var audioOutputButtons = document.querySelectorAll(".audio-output-button");
	for (var i = 0; i < audioOutputButtons.length; i++) {
		audioOutputButtons[i].style.marginLeft = newMargin + "%";
		audioOutputButtons[i].style.marginRight = newMargin + "%";
	}

	// update width of audio-input buttons
	newMargin = 5 / numOfDisplayIns;
	var audioInputButtons = document.querySelectorAll(".audio-input-button");
	for (var i = 0; i < audioInputButtons.length; i++) {
		audioInputButtons[i].style.marginLeft = newMargin + "%";
		audioInputButtons[i].style.marginRight = newMargin + "%";
	}
}

function pleaseWait() {
	swal({
		title: "Please Wait",
		text: "Command sent successfully.",
		timer: swalTimeout,
		showConfirmButton: false
	});
}

function wakeSystem() {
	$("#idle-splash").hide();
	$("#loading-splash").show();

	setTimeout(function() {
		$("#loading-splash").fadeOut();
		getRoom();
		setup();

		// if (window.location.hash) { // If we're refreshing a page or opening a bookmark, open the proper tab
		// var hashPage = window.location.hash.substring(1, window.location.hash.length);
		// bootpage.show(hashPage, updateActiveTab);
		// } else {
		bootpage.show("displays-page", updateActiveTab);
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
			}, function() {
				powerOffRoom();
			});

			setTimeout(function() {
				window.location = "/"; // Reload the page without hashes
			}, swalTimeout);
		} else {
			swal.close();
		}
	});
}

function updateActiveTab() {
	$("#displays-tab").removeClass("active")
	$("#audio-control-tab").removeClass("active");

	var currentTab = bootpage.currentPage.substring(0, bootpage.currentPage.length - 5);

	$("#" + currentTab + "-tab").addClass("active");
}
