window.TOUCHPANEL_STATE = "OFF"
// Block power-on interactions while a power-off sequence is running
window.POWERING_OFF = false;
window.POWERING_ON = false;
window.POWER_ON_ATTEMPT_ID = 0;

const POWER_ON_TIMEOUT_MS = 30 * 1000;
const POWER_ON_STATUS_TIMEOUT_MS = 5 * 1000;

document.addEventListener('DOMContentLoaded', async () => {
    window.themeService = new ThemeService();
    await window.themeService.fetchTheme();
    await loadComponent('startingScreen', '.starting-screen')
    window.SocketService = new SocketService();
    window.APIService = new APIService();

    // Wait for APIService to finish loading configs before creating DataService
    window.APIService.addEventListener('loaded', async () => {
        window.components.startingScreen.initLoadedScreen();
        window.VolumeSlider = VolumeSlider;
        window.DataService = new DataService(window.APIService);
        await window.DataService.init();
        window.CommandService = new CommandService(http, window.DataService, window.APIService, null);
        window.components.startingScreen.addIndependentAudioButton();

        // check if the room is already on
        for (const display of APIService.room.status.displays) {
            //check if display is in preset and powered on
            const presetDisplayNames = window.DataService.panel.preset.displays.map(d => d.name);
            if (!presetDisplayNames.includes(display.name)) {
                continue;
            }
            if ((display.power || "").toLowerCase() === "on") {
                window.DataService.addEventListener('loaded', async () => {
                    await startPowerOnAttempt(true);
                }, { once: true });
                break;
            }
        }
    });

    // when user clicks on starting screen, it emits 'starting' event
    if (!window._startingScreenListenerAdded) {
        window._startingScreenListenerAdded = true;

        window.components.startingScreen.addEventListener('starting', async () => {
            await startPowerOnAttempt(false, async () => {
                console.log("Starting screen clicked, powering on...");
                // Log the very first user interaction when powering on
                if (window.CommandService && typeof window.CommandService.buttonPress === "function") {
                    window.CommandService.buttonPress('clicked starting screen to power on', {});
                }

                await window.themeService.fetchTheme();

                window.SocketService = new SocketService();
            });
        });
    }
});

async function startPowerOnAttempt(skipPowerCommand = false, beforePowerOn = null) {
    if (window.TOUCHPANEL_STATE === "ON") return;
    if (window.POWERING_ON || window.POWERING_OFF) return;

    const attemptId = ++window.POWER_ON_ATTEMPT_ID;
    window.POWERING_ON = true;

    try {
        await withPowerOnTimeout((async () => {
            if (beforePowerOn) {
                await beforePowerOn();
                assertPowerOnAttemptCurrent(attemptId);
            }

            await powerOnUI(skipPowerCommand, attemptId);
        })(), POWER_ON_TIMEOUT_MS);
    } catch (err) {
        console.error("Power on attempt failed", err);
        resetPowerOnAttempt(attemptId);
    } finally {
        if (isPowerOnAttemptCurrent(attemptId)) {
            window.POWERING_ON = false;
        }
    }
}

async function withPowerOnTimeout(promise, timeoutMs) {
    let timeout;
    const timeoutPromise = new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Power on timed out")), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeout);
    }
}

function isPowerOnAttemptCurrent(attemptId) {
    return window.POWERING_ON && attemptId === window.POWER_ON_ATTEMPT_ID;
}

function assertPowerOnAttemptCurrent(attemptId) {
    if (!isPowerOnAttemptCurrent(attemptId)) {
        throw new Error("Power on attempt was superseded");
    }
}

function resetPowerOnAttempt(attemptId) {
    if (attemptId !== window.POWER_ON_ATTEMPT_ID) return;

    window.POWER_ON_ATTEMPT_ID++;
    window.POWERING_ON = false;
    window.TOUCHPANEL_STATE = "OFF";

    removeComponentAssets();
    removeZPattern();

    const startingScreen = document.querySelector('.starting-screen');
    if (startingScreen) startingScreen.classList.remove('hidden');

    if (window.components?.startingScreen) {
        window.components.startingScreen.resetToLoadedScreen();
    }

    createZPattern();
}

async function loadComponent(componentName, divQuerySelector = `.component-container`) {
    console.log(`Loading component: ${componentName} into ${divQuerySelector}`);
    const htmlPath = `./components/${componentName}/${componentName}.html`;
    const jsPath = `./components/${componentName}/${componentName}.js`;
    // const cssPath = `./components/${componentName}/${componentName}.css`;

    // load the css
    // const stylesheet = document.createElement('link');
    // stylesheet.rel = 'stylesheet';
    // stylesheet.href = cssPath;
    // stylesheet.id = 'component-stylesheet';
    // stylesheet.onload = () => {
    //     const module = window.components?.[componentName];
    //     if (module?.loadStyles) {
    //         module.loadStyles();
    //     }
    // }

    // document.body.appendChild(stylesheet);

    // load the html
    const componentContainer = document.querySelector(divQuerySelector);
    componentContainer.classList.add('loading'); // hide before loading
    const response = await fetch(htmlPath);
    const html = await response.text();
    componentContainer.innerHTML = html;

    // load the js
    const script = document.createElement('script');
    script.src = jsPath;
    script.id = 'component-script';

    // call loadPage on the new component
    await new Promise((resolve, reject) => {
        script.onload = () => {
            const module = window.components?.[componentName];
            if (module?.loadPage) {
                module.loadPage();
                if (divQuerySelector === `.component-container`) {
                    // If it's the main component, track the current component
                    currentComponent = componentName;
                }
            }
            componentContainer.classList.remove('loading'); // finally show it
            resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Ensure DataService is fully initialized before we try to use panel data.
// This prevents the display component from rendering with undefined presets/displays
// when the user taps the starting screen before initialization finishes.
async function waitForDataServiceReady() {
    const ready = () => window.DataService && window.DataService.panel && window.DataService.panel.preset;

    if (ready()) return;

    // Prefer the DataService 'loaded' event when available; otherwise poll briefly.
    await new Promise((resolve) => {
        if (window.DataService && typeof window.DataService.addEventListener === "function") {
            const onLoaded = () => {
                if (ready()) {
                    window.DataService.removeEventListener('loaded', onLoaded);
                    resolve();
                }
            };
            window.DataService.addEventListener('loaded', onLoaded, { once: true });
        } else {
            const interval = setInterval(() => {
                if (ready()) {
                    clearInterval(interval);
                    resolve();
                }
            }, 50);
        }
    });
}

function loadSvg(id, path) {
    // If no path or an undefined icon is provided, use the blank placeholder
    if (!path || String(path).toLowerCase().includes("undefined")) {
        path = "assets/blank.svg";
    }

    // make path all lower case
    path = String(path).toLowerCase();

    fetch(path)
        .then(response => {
            if (!response.ok && response.status === 404) {
                // Fallback to blank.svg if not found
                return fetch('assets/blank.svg').then(blankRes => blankRes.text());
            }
            return response.text();
        })
        .then(svg => {
            document.getElementById(id).innerHTML = svg;
        })
        .catch(() => {
            // On any other fetch error, fall back to blank.svg
            fetch('assets/blank.svg')
                .then(blankRes => blankRes.text())
                .then(svg => { document.getElementById(id).innerHTML = svg; });
        });
}

function removeComponentAssets() {
    document.querySelectorAll('.help-modal').forEach(el => el.remove());
    document.querySelectorAll("#component-stylesheet, #component-script")
        .forEach(el => {
            if (el.href && el.href.includes('startingScreen')) return; // never remove starting screen assets
            if (el.src && el.src.includes('startingScreen')) return; // never remove starting screen assets
            el.remove();
        });
    document.querySelector('.display-component').innerHTML = '';
    document.querySelector('.audio-control-component').innerHTML = '';
    document.querySelector('.camera-control-component').innerHTML = '';
    document.querySelector('.header').style.display = 'none';
    currentComponent = null;
    isCameras = false;
}

async function handlePowerOffClick(updateUIOnly = false) {
    if (window.TOUCHPANEL_STATE === "OFF") { return; }
    if (!updateUIOnly) { window.POWERING_OFF = true; }
    window.TOUCHPANEL_STATE = "OFF";
    window.resetViewPosition(); // reset view position to display component

    // show the starting screen with power off message
    const startingScreenMessage = document.querySelector('.starting-screen-message');
    startingScreenMessage.innerHTML = `
        <div class="loading-circle"></div>
        Powering Off...`;
    const startingScreen = document.querySelector('.starting-screen');
    startingScreen.classList.remove('hidden');
    createZPattern();

    // call power off command
    if (!updateUIOnly) {
        await window.CommandService.powerOff(window.DataService.panel.preset);
    }
    removeComponentAssets();

    // return starting screen to initial state
    startingScreenMessage.innerHTML = `Touch Anywhere to Start`;

    // reset help button
    const helpBtn = document.querySelector('.help-btn');
    helpBtn.removeEventListener('click', handleHelpClick);

    // reset power button (remove this handler)
    const powerBtn = document.querySelector('.power-off-btn');
    powerBtn.removeEventListener('click', onPowerButtonClick);

    if (!updateUIOnly) { window.POWERING_OFF = false; }
}

function handleHelpClick() {
    window.CommandService.buttonPress(`clicked help button`, {});
    const helpModal = new HelpModal();
    helpModal.open();
}

// Keep a stable reference so we can add/remove without duplication
const onPowerButtonClick = () => {
    window.CommandService.buttonPress(`clicked power off button`, {});
    handlePowerOffClick();
};

async function powerOnUI(skipPowerCommand = false, attemptId = window.POWER_ON_ATTEMPT_ID) {
    if (window.TOUCHPANEL_STATE === "ON") { return; }
    if (window.POWERING_OFF) { return; }
    console.log("Powering on UI");

    await waitForDataServiceReady();
    assertPowerOnAttemptCurrent(attemptId);

    if (!skipPowerCommand) {
        const success = await window.CommandService.powerOnDefault(window.DataService.panel.preset);
        assertPowerOnAttemptCurrent(attemptId);

        if (!success) {
            throw new Error("Power on command failed");
        }

        try {
            await window.APIService.refreshRoomStatus(POWER_ON_STATUS_TIMEOUT_MS);
            assertPowerOnAttemptCurrent(attemptId);
            window.DataService.rebuildFromStatus();
        } catch (err) {
            console.warn("Room status refresh failed after power on", err);
            assertPowerOnAttemptCurrent(attemptId);
        }
    }
    removeZPattern();
    currentComponent = 'display';
    await loadComponent(currentComponent, `.display-component`);
    assertPowerOnAttemptCurrent(attemptId);
    await loadComponent('audioControl', `.audio-control-component`);
    assertPowerOnAttemptCurrent(attemptId);
    isCameras = window.DataService.panel.preset.cameras.length > 0;
    if (isCameras) {
        await loadComponent('cameraControl', `.camera-control-component`);
        assertPowerOnAttemptCurrent(attemptId);
    } else {
        console.log("No cameras in preset, skipping camera component load");
        // hide the camera-control-component and camera tab
        const cameraControlComponent = document.querySelector('.camera-control-component');
        if (cameraControlComponent) {
            cameraControlComponent.classList.add('hidden');
        }
        const cameraTab = document.querySelector('.camera-control-tab');
        if (cameraTab) {
            cameraTab.classList.add('hidden');
            cameraTab.classList.remove('tab');
        }
    }

    //remove the starting screen
    const startingScreen = document.querySelector('.starting-screen');
    window.TOUCHPANEL_STATE = "ON";
    window.POWERING_ON = false;
    document.dispatchEvent(new window.Event("UILoaded"));
    document.querySelector('.header').style.display = 'flex';
    startingScreen.classList.add('hidden');

    // listener for power button
    const powerBtn = document.querySelector('.power-off-btn');
    powerBtn.addEventListener('click', onPowerButtonClick);

    const helpBtn = document.querySelector('.help-btn');

    helpBtn.addEventListener('click', handleHelpClick);
}
