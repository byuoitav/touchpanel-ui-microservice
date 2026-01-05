window.TOUCHPANEL_STATE = "OFF"

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
                    await powerOnUI(true);
                }, { once: true });
                break;
            }
        }
    });

    // when user clicks on starting screen, it emits 'starting' event
    if (!window._startingScreenListenerAdded) {
        window._startingScreenListenerAdded = true;

        window.components.startingScreen.addEventListener('starting', async () => {
            console.log("Starting screen clicked, powering on...");

            await window.themeService.fetchTheme();

            window.SocketService = new SocketService();

            window.DataService = new DataService(window.APIService);
            await window.DataService.init();
            window.CommandService = new CommandService(http, window.DataService, window.APIService, null);

            // wait for DataService to be fully initialized (after dispatchEvent)
            window.DataService.addEventListener('loaded', async () => {
                await powerOnUI();
            }, { once: true });

        });
    }
});

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

function loadSvg(id, path) {
    // make path all lower case
    path = path.toLowerCase();
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
    powerBtn.removeEventListener('click', handlePowerOffClick);
}

function handleHelpClick() {
    window.CommandService.buttonPress(`clicked help button`, {});
    const helpModal = new HelpModal();
    helpModal.open();
}

async function powerOnUI(skipPowerCommand = false) {
    if (window.TOUCHPANEL_STATE === "ON") { return; }
    window.TOUCHPANEL_STATE = "ON";
    console.log("Powering on UI");
    if (!skipPowerCommand) {
        await window.CommandService.powerOnDefault(window.DataService.panel.preset);
    }
    removeZPattern();
    currentComponent = 'display';
    await loadComponent(currentComponent, `.display-component`);
    await loadComponent('audioControl', `.audio-control-component`);
    isCameras = window.DataService.panel.preset.cameras.length > 0;
    if (isCameras) {
        await loadComponent('cameraControl', `.camera-control-component`);
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
    document.dispatchEvent(new window.Event("UILoaded"));
    document.querySelector('.header').style.display = 'flex';
    startingScreen.classList.add('hidden');

    // listener for power button
    const powerBtn = document.querySelector('.power-off-btn');
    powerBtn.addEventListener('click', () => {
        window.CommandService.buttonPress(`clicked power off button`, {});
        handlePowerOffClick();
    });

    const helpBtn = document.querySelector('.help-btn');

    helpBtn.addEventListener('click', handleHelpClick);
}