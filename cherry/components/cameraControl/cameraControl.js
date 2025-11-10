window.components = window.components || {};

window.components.cameraControl = {
    cameraMap: new Map(),
    controlKey: "",
    movementPromises: new Map(), // cameraIndex -> { [direction]: Promise }

    loadPage: async function () {
        this.cameraMap.clear();
        this.renderCameras();
        this.addCameraTabListeners();

        // Make the first tab active initially
        const firstTab = document.getElementById(`camera-0`);
        firstTab.classList.add('active-camera-tab');

        console.log(this.cameraMap);
        // Get control key
        await this.updateControlKey();

        this.addCameraControlListeners();
        this.addPresetListeners();

        // reload code every minute
        setInterval(async () => {
            await this.updateControlKey();
        }, 1 * 60 * 1000);
    },

    cleanup: function () {
        this.cameraMap.clear();
        const cameraTabs = document.querySelectorAll('.camera-tabs-container');
        const cameraControls = document.querySelectorAll('.camera-controls-container');

        cameraTabs.forEach(tab => tab.innerHTML = '');
        cameraControls.forEach(control => control.innerHTML = '');
    },

    getControlKey: async function () {
        const presetName = encodeURIComponent(window.DataService.panel.preset.name);
        const url = window.location.protocol + "//" + window.location.host + "/control-key/" + window.room + "/" + presetName;
        console.log(url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP Status Error: ${response.status}`);
            }
            const data = await response.json();
            this.controlKey = data["ControlKey"];
            document.cookie = `control-key=${this.controlKey}; `;
        } catch (err) {
            console.warn("err", err);
            this.controlKey = "Error: Failed to fetch control key";
        } finally {
            // console.log("complete");
        }
    },

    sendCamCommand: async function (url, code) {
        console.log("Sending camera command to URL:", url, "with code:", code);
        const body = { url, code };

        return fetch(window.location.protocol + "//" + window.location.host + "/camera-control", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
            .then(async response => {
                if (!response.ok) {
                    const responseBody = await response.json();
                    throw new Error(`Error: ${responseBody}`);
                }
                return response.json();
            })
            .then(responseData => {
                console.log("response from backend:", responseData);
                return responseData;
            });
    },

    updateControlKey: async function () {
        await this.getControlKey();
        const codeElements = document.querySelectorAll('.camera-code');
        // console.log("Control Key Received:", this.controlKey);
        if (codeElements) {
            // console.log("Updating camera code elements with control key:", this.controlKey);
            codeElements.forEach(codeElement => {
                codeElement.innerHTML = `
                    <p class="camera-code"> For room control, go to ${window.themeService.camLink} </p>
                    <p class="camera-code"> Control Key: ${this.controlKey} </p>
                `;
            });
        }
    },

    addCameraTabListeners: function () {
        const cameraTabs = document.querySelectorAll('.camera-tab');
        cameraTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                window.CommandService.buttonPress(`clicked camera tab ${index}`, {});
                // Remove active class from all tabs
                cameraTabs.forEach(t => t.classList.remove('active-camera-tab'));
                // Add active class to clicked tab
                tab.classList.add('active-camera-tab');

                // Hide all camera controls
                const wrappers = document.querySelectorAll('.camera-controls-wrapper');
                wrappers.forEach(w => w.style.display = 'none');

                // Show only the selected camera control
                const activeWrapper = document.getElementById(`camera-controls-wrapper-${index}`);
                if (activeWrapper) {
                    activeWrapper.style.display = 'flex';
                }
            });
        });
    },

    renderCameras: function () {
        const cameras = window.DataService.panel.preset.cameras;
        let camIndex = 0;
        for (const camera of cameras) {
            this.cameraMap.set(camIndex, camera); // Add camera to map
            console.log("Rendering camera:", camera, camIndex);
            this.renderCamera(camera, camIndex);
            camIndex++;
        }
    },

    renderCamera: function (camera, index) {
        this.renderCameraTab(camera, index);
        this.renderCameraControl(camera, index);
        this.renderCameraPresets(camera, index);
    },

    renderCameraTab: function (camera, index) {
        const cameraTab = `<div class="camera-tab" id="camera-${index}">
        ${camera.displayName}
            </div>`;
        `;`

        const cameraTabsContainer = document.querySelector('.camera-tabs-container');
        cameraTabsContainer.insertAdjacentHTML('beforeend', cameraTab);
    },

    renderCameraControl: function (camera, index) {
        const cameraControlContainer = document.querySelector('.camera-controls-container');

        const cameraControlWrapper = `<div class="camera-controls-wrapper" id="camera-controls-wrapper-${index}">
        </div>`;

        cameraControlContainer.insertAdjacentHTML('beforeend', cameraControlWrapper);

        const cameraControlWrapperElement = document.getElementById(`camera-controls-wrapper-${index}`);

        const dpadHTML = this.createCameraDpad(camera, index);
        const dpadElement = document.createElement('div');
        dpadElement.innerHTML = dpadHTML;
        while (dpadElement.firstChild) {
            cameraControlWrapperElement.appendChild(dpadElement.firstChild);
        }

        const camPresetsHTML = this.renderCameraPresets(camera, index);
        const camPresetsElement = document.createElement('div');
        camPresetsElement.innerHTML = camPresetsHTML;
        while (camPresetsElement.firstChild) {
            cameraControlWrapperElement.appendChild(camPresetsElement.firstChild);
        }
    },

    createCameraDpad: function (camera, index) {
        // Implementation for creating camera control
        const dpadHTML = `
        <div class="camera-controls">
            <div class="set">
                <nav class="d-pad">
                    <a class="up" id="camera-${index}-up" href="#"></a>
                    <a class="right" id="camera-${index}-right" href="#"></a>
                    <a class="down" id="camera-${index}-down" href="#"></a>
                    <a class="left" id="camera-${index}-left" href="#"></a>
                </nav>
            </div>
            <div class="zoom-controls">
                <button class="zoom-btn zoom-in-btn" id="camera-${index}-zoom-in">
                    <img src="assets/zoom_in.svg">
                </button>
                <button class="zoom-btn zoom-out-btn" id="camera-${index}-zoom-out">
                    <img src="assets/zoom_out.svg">
                </button>
            </div>
            <p class="camera-code"></p>
        </div>
        
        `;

        return dpadHTML;
    },

    renderCameraPresets: function (camera, cameraIndex) {
        const presets = camera.presets || [];
        if (presets.length === 0) {
            return `<p class="no-presets">No presets available for this camera.</p>`;
        }
        const presetButtons = presets.map((preset, index) => {
            return `<button class="preset-btn btn" data-preset-id="preset-${cameraIndex}-${index}">${preset.displayName}</button>`;
        }).join('');

        const presetsHTML = `
        <div class="camera-presets-container">
            <p class="presets-title">Presets</p>
            <div class="presets-container">
                ${presetButtons}
            </div>
        </div>`;

        return presetsHTML;
    },

    addPresetListeners: function () {
        // each button has data-preset-id="preset-<cameraIndex>-<presetIndex>"
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                window.CommandService.buttonPress(`clicked preset button`, {presetId: event.currentTarget.dataset.presetId});
                const presetId = event.currentTarget.dataset.presetId;
                this.handlePresetClick(presetId);
            });
        });
    },

    handlePresetClick: async function (presetId) {
        const [cameraIndex, presetIndex] = presetId.split('-').slice(1).map(Number);
        const camera = this.cameraMap.get(cameraIndex);
        if (!camera) return;

        await this.sendCamCommand(camera.presets[presetIndex].setPreset, this.controlKey);
    },

    addCameraControlListeners: function () {
        const movementMap = {
            up: 'tiltUp',
            down: 'tiltDown',
            left: 'panLeft',
            right: 'panRight',
            'zoom-in': 'zoomIn',
            'zoom-out': 'zoomOut'
        };

        const stopKeyMap = {
            up: 'panTiltStop',
            down: 'panTiltStop',
            left: 'panTiltStop',
            right: 'panTiltStop',
            'zoom-in': 'zoomStop',
            'zoom-out': 'zoomStop'
        };
        const supportsPointerEvents = !!window.PointerEvent;

        for (let index = 0; index < this.cameraMap.size; index++) {
            Object.keys(movementMap).forEach(dir => {
                const elementId = `camera-${index}-${dir}`;
                const element = document.getElementById(elementId);
                if (!element) return;

                const start = () => {
                    window.CommandService.buttonPress(`clicked camera ${index} ${dir} button`, {});
                    this.startCameraAction(index, movementMap[dir]);
                };

                const stop = () => {
                    window.CommandService.buttonPress(`released camera ${index} ${dir} button`, {});
                    this.stopCameraAction(index, stopKeyMap[dir], movementMap[dir]);
                };

                let isPressing = false;

                const beginPress = () => {
                    if (isPressing) {
                        return;
                    }
                    isPressing = true;
                    start();
                };

                const endPress = () => {
                    if (!isPressing) {
                        return;
                    }
                    isPressing = false;
                    stop();
                };

                if (supportsPointerEvents) {
                    let activePointerId = null;

                    const releasePointerCapture = (event) => {
                        if (!element.releasePointerCapture || typeof event.pointerId === 'undefined') {
                            return;
                        }
                        if (element.hasPointerCapture && !element.hasPointerCapture(event.pointerId)) {
                            return;
                        }
                        try {
                            element.releasePointerCapture(event.pointerId);
                        } catch (err) {
                            // Ignore if pointer capture is no longer active.
                        }
                    };

                    const handlePointerRelease = (event) => {
                        if (activePointerId === null || event.pointerId !== activePointerId) {
                            return;
                        }
                        activePointerId = null;
                        releasePointerCapture(event);
                        endPress();
                    };

                    element.addEventListener('pointerdown', event => {
                        if (event.pointerType === 'mouse' && event.button !== 0) {
                            return;
                        }
                        event.preventDefault();
                        activePointerId = event.pointerId;
                        beginPress();
                        if (element.setPointerCapture && typeof event.pointerId !== 'undefined') {
                            try {
                                element.setPointerCapture(event.pointerId);
                            } catch (err) {
                                // Ignore capture failures; fallback handlers will clean up.
                            }
                        }
                    });

                    element.addEventListener('pointerup', handlePointerRelease);
                    element.addEventListener('pointercancel', handlePointerRelease);
                    window.addEventListener('pointerup', handlePointerRelease);
                    window.addEventListener('pointercancel', handlePointerRelease);
                    element.addEventListener('lostpointercapture', handlePointerRelease);
                } else {
                    let mouseActive = false;
                    let activeTouchId = null;

                    const handleMouseUp = () => {
                        if (!mouseActive) {
                            return;
                        }
                        mouseActive = false;
                        endPress();
                    };

                    element.addEventListener('mousedown', event => {
                        if (event.button !== 0) {
                            return;
                        }
                        event.preventDefault();
                        mouseActive = true;
                        beginPress();
                    });

                    document.addEventListener('mouseup', handleMouseUp);

                    element.addEventListener('touchstart', event => {
                        if (isPressing) {
                            return;
                        }
                        const touch = event.changedTouches && event.changedTouches[0];
                        if (!touch) {
                            return;
                        }
                        activeTouchId = touch.identifier;
                        event.preventDefault(); // Prevents simulated mouse events
                        beginPress();
                    }, { passive: false });

                    const handleTouchRelease = event => {
                        if (activeTouchId === null) {
                            return;
                        }
                        const released = Array.from(event.changedTouches || []).some(touch => touch.identifier === activeTouchId);
                        if (released) {
                            activeTouchId = null;
                            endPress();
                        }
                    };

                    document.addEventListener('touchend', handleTouchRelease);
                    document.addEventListener('touchcancel', handleTouchRelease);
                }
            });
        }
    },



    handleDpadClick: function (direction, cameraIndex) {
        switch (direction) {
            case 'up':
                this.handleUp(cameraIndex);
                break;
            case 'down':
                this.handleDown(cameraIndex);
                break;
            case 'left':
                this.handleLeft(cameraIndex);
                break;
            case 'right':
                this.handleRight(cameraIndex);
                break;
        }
    },

    startCameraAction: function (cameraIndex, actionKey) {
        const camera = this.cameraMap.get(cameraIndex);
        if (!camera || !camera[actionKey]) return;

        const movementForCamera = this.movementPromises.get(cameraIndex) || {};
        const promise = this.sendCamCommand(camera[actionKey], this.controlKey);
        movementForCamera[actionKey] = promise;
        this.movementPromises.set(cameraIndex, movementForCamera);
    },

    stopCameraAction: async function (cameraIndex, stopKey, actionKey) {
        const camera = this.cameraMap.get(cameraIndex);
        if (!camera || !camera[stopKey]) return;

        const movementForCamera = this.movementPromises.get(cameraIndex) || {};
        const promise = movementForCamera[actionKey];
        if (promise) {
            try {
                await promise;
            } catch (err) {
                console.warn("Movement start failed:", err);
            }
        }

        await this.sendCamCommand(camera[stopKey], this.controlKey);
    },



    handleUp: function (cameraIndex) {
        window.CommandService.buttonPress(`clicked camera ${cameraIndex} up button`, {});
        console.log("Handling Up for camera index:", cameraIndex);
        const camera = this.cameraMap.get(cameraIndex);
        if (camera) {
            this.sendCamCommand(camera.tiltUp, this.controlKey);
        }
    },

    handleDown: function (cameraIndex) {
        window.CommandService.buttonPress(`clicked camera ${cameraIndex} down button`, {});
        console.log("Handling Down for camera index:", cameraIndex);
        const camera = this.cameraMap.get(cameraIndex);
        if (camera) {
            this.sendCamCommand(camera.tiltDown, this.controlKey);
        }
    },

    handleLeft: function (cameraIndex) {
        window.CommandService.buttonPress(`clicked camera ${cameraIndex} left button`, {});
        console.log("Handling Left for camera index:", cameraIndex);
        const camera = this.cameraMap.get(cameraIndex);
        if (camera) {
            this.sendCamCommand(camera.panLeft, this.controlKey);
        }
    },

    handleRight: function (cameraIndex) {
        window.CommandService.buttonPress(`clicked camera ${cameraIndex} right button`, {});
        console.log("Handling Right for camera index:", cameraIndex);
        const camera = this.cameraMap.get(cameraIndex);
        if (camera) {
            this.sendCamCommand(camera.panRight, this.controlKey);
        }
    },

    handleZoomIn: async function (cameraIndex) {
        window.CommandService.buttonPress(`clicked camera ${cameraIndex} zoom in button`, {});
        console.log("Handling Zoom In for camera index:", cameraIndex);
        const camera = this.cameraMap.get(cameraIndex);
        if (camera) {
            await this.sendCamCommand(camera.zoomIn, this.controlKey);
        }
    },

    handleZoomOut: function (cameraIndex) {
        window.CommandService.buttonPress(`clicked camera ${cameraIndex} zoom out button`, {});
        console.log("Handling Zoom Out for camera index:", cameraIndex);
        const camera = this.cameraMap.get(cameraIndex);
        if (camera) {
            this.sendCamCommand(camera.zoomOut, this.controlKey);
        }
    },

    handlePanTiltStop: function (cameraIndex) {
        console.log("Handling Pan/Tilt Stop for camera index:", cameraIndex);
        const camera = this.cameraMap.get(cameraIndex);
        if (camera) {
            this.sendCamCommand(camera.panTiltStop, this.controlKey);
        }
    },

    handleZoomStop: function (cameraIndex) {
        console.log("Handling Zoom Stop for camera index:", cameraIndex);
        const camera = this.cameraMap.get(cameraIndex);
        if (camera) {
            this.sendCamCommand(camera.zoomStop, this.controlKey);
        }
    },
}
