document.addEventListener('DOMContentLoaded', async () => {
    window.VolumeSlider = VolumeSlider;
    currentComponent = 'cameraControl'; // Set the current component to display
    await loadComponent(currentComponent);
});
document.addEventListener('click', (e))

async function loadComponent(componentName, divQuerySelector = `.component-container`) {
    // Only call cleanup if the primary component, won't call cleanup on smaller components
    // like the keypad, which is a child component of the login component
    if (window.components?.[currentComponent]?.cleanup && divQuerySelector === `.component-container`) {
        window.components[currentComponent].cleanup();
    }

    const htmlPath = `./components/${componentName}/${componentName}.html`;
    const jsPath = `./components/${componentName}/${componentName}.js`;
    const cssPath = `./components/${componentName}/${componentName}.css`;

    // load the css
    const oldStylesheet = document.getElementById('component-stylesheet');
    if (oldStylesheet && divQuerySelector === `.component-container`) {
        oldStylesheet.remove();
    }

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

    document.head.appendChild(stylesheet);

    // load the html
    const componentContainer = document.querySelector(divQuerySelector);
    componentContainer.classList.add('loading'); // hide before loading
    const response = await fetch(htmlPath);
    const html = await response.text();
    componentContainer.innerHTML = html;

    // load the js
    const oldScript = document.getElementById('component-script');
    if (oldScript) {
        oldScript.remove();
    }

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