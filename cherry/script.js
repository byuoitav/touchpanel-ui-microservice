document.addEventListener('DOMContentLoaded', async () => {
    window.themeService = new ThemeService();
    window.SocketService = new SocketService();
    window.APIService = new APIService(window.themeService);

    // Wait for APIService to finish loading configs before creating DataService
    window.APIService.addEventListener('loaded', async () => {
        window.DataService = new DataService();
        window.VolumeSlider = VolumeSlider;
        window.GraphService = new GraphService(window.DataService, window.SocketService);

        window.GraphService.addEventListener("displayList", e => {
            console.log("Updated display list:", Array.from(e.detail));
        });

        currentComponent = 'display'; // Set the current component to display
        await loadComponent(currentComponent, `.display-component`);
        await loadComponent('audioControl', `.audio-control-component`);
        await loadComponent('cameraControl', `.camera-control-component`);
    }, { once: true });
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
    };
    document.body.appendChild(script);
}