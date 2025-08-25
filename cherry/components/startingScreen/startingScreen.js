window.components = window.components || {};

class StartingScreen extends EventTarget {
    loadPage() {
        this.addLogo();
        this.addTouchListener();
        this.dispatchEvent(new CustomEvent("componentReady", { detail: true }));
    }

    cleanup() {
        // Add cleanup logic if necessary
    }

    addLogo() {
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer && window.themeService.logo) {
            // Clear existing content
            logoContainer.innerHTML = '';

            // Insert SVG directly
            logoContainer.innerHTML = window.themeService.logo.trim();
        }
    }



    addTouchListener() {
        const container = document.querySelector('.starting-screen-container');
        if (container) {
            container.addEventListener('click', () => {
                // Replace the contents of .starting-screen-message with a loading circle
                const message = document.querySelector('.starting-screen-message');
                if (message) {
                    message.innerHTML = '<div class="loading-circle"></div>';
                    this.dispatchEvent(new CustomEvent("starting", { detail: true }));
                }
            });
        }
    }
}

window.components.startingScreen = new StartingScreen();