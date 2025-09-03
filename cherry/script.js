document.addEventListener('DOMContentLoaded', async () => {
    window.themeService = new ThemeService();
    await window.themeService.fetchTheme();

    await loadComponent('startingScreen', '.starting-screen')

    // when user clicks on starting screen, it emits 'starting' event
    if (!window._startingScreenListenerAdded) {
        window._startingScreenListenerAdded = true;

        window.components.startingScreen.addEventListener('starting', async () => {
            console.log("Starting screen clicked, powering on...");

            await window.themeService.fetchTheme();

            window.SocketService = new SocketService();
            window.APIService = new APIService();

            // Wait for APIService to finish loading configs before creating DataService
            window.APIService.addEventListener('loaded', () => {
                window.DataService = new DataService(window.APIService);
                window.DataService.init();
                window.CommandService = new CommandService(http, window.DataService, window.APIService, null);

                // wait for DataService to be fully initialized (after dispatchEvent)
                window.DataService.addEventListener('loaded', async () => {
                    await window.CommandService.powerOnDefault(window.DataService.panel.preset);
                    window.VolumeSlider = VolumeSlider;
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
                    insertOffsetImage('assets/zcosmo.png');
                }, { once: true });
            }, { once: true });

            // listener for power button
            const powerBtn = document.querySelector('.power-off-btn');
            powerBtn.addEventListener('click', handlePowerClick);

            async function handlePowerClick() {
                window.CommandService.buttonPress(`clicked power off button`, {});
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
                await window.CommandService.powerOff(window.DataService.panel.preset);
                removeComponentAssets();

                // return starting screen to initial state
                startingScreenMessage.innerHTML = `Touch Anywhere to Start`;

                // reset help button
                const helpBtn = document.querySelector('.help-btn');
                helpBtn.removeEventListener('click', handleHelpClick);

                // reset power button (remove this handler)
                const powerBtn = document.querySelector('.power-off-btn');
                powerBtn.removeEventListener('click', handlePowerClick);
            }

            const helpBtn = document.querySelector('.help-btn');

            function handleHelpClick() {
                window.CommandService.buttonPress(`clicked help button`, {});
                const helpModal = new HelpModal();
                helpModal.open();
            }

            helpBtn.addEventListener('click', handleHelpClick);
        });
    }
});


async function loadComponent(componentName, divQuerySelector = `.component-container`) {
    const htmlPath = `./components/${componentName}/${componentName}.html`;
    const jsPath = `./components/${componentName}/${componentName}.js`;
    const cssPath = `./components/${componentName}/${componentName}.css`;

    // load the css
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = cssPath;
    stylesheet.id = 'component-stylesheet';
    stylesheet.onload = () => {
        const module = window.components?.[componentName];
        if (module?.loadStyles) {
            module.loadStyles();
        }
    }

    document.body.appendChild(stylesheet);

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
    fetch(path)
        .then(response => response.text())
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
}


function insertOffsetImage(imgSrc) {
    const displayComponent = document.querySelector('.display-component');
    if (!displayComponent) return;

    // Ensure the display component can anchor absolutely positioned children
    displayComponent.style.position = 'relative';

    // Create the image
    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.position = 'absolute';

    // Position offset to the left by 120% of the display component’s width
    img.style.left = '-120%';

    // Center vertically relative to the display component
    img.style.top = '50%';
    img.style.transform = 'translateY(-50%) rotate(90deg)';

    img.style.height = '1000px';
    img.style.width = 'auto';

    displayComponent.appendChild(img);
}



