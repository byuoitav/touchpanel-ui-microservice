window.components = window.components || {};

class StartingScreen extends EventTarget {
    loadPage() {
        this.addLogo();
        this.addTouchListener();
        this.dispatchEvent(new CustomEvent("componentReady", { detail: true }));
        createZPattern();
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
                    removeZPattern();
                }
            });
        }
    }
}

function createSquare(positionClass, onTap) {
    console.log(`Creating square at position: ${positionClass}`);
    const square = document.createElement('div');
    square.className = `square ${positionClass}`;

    // Show the square on touch or mouse down
    const show = () => square.style.opacity = 0.2;
    const hide = () => square.style.opacity = 0;

    // Event handling
    square.addEventListener('mousedown', e => { 
        window.CommandService.buttonPress(`clicked square ${positionClass}`, {});
        show(); onTap(); 
    });
    square.addEventListener('mouseup', hide);
    square.addEventListener('touchstart', e => { show(); onTap(); });
    square.addEventListener('touchend', hide);
    document.body.appendChild(square);
    return square;
}

// v Z-Pattern Stuff Below v
let topLeft, topRight, bottomLeft, bottomRight;

function createZPattern() {
    topLeft = createSquare('top-left', () => {
        if (!topRight) {
            topRight = createSquare('top-right', () => {
                if (!bottomLeft) {
                    bottomLeft = createSquare('bottom-left', () => {
                        if (!bottomRight) {
                            bottomRight = createSquare('bottom-right', () => {
                                window.location.href = 'http://localhost:10000/dashboard/overview';
                            });
                        }
                    });
                }
            });
        }
        // Clean up all but topLeft after 20 seconds
        setTimeout(() => {
            [topRight, bottomLeft, bottomRight].forEach(sq => {
                if (sq && sq.parentElement) sq.remove();
            });
            topRight = bottomLeft = bottomRight = null;
        }, 20000);
    });



}

function removeZPattern() {
    [topLeft, topRight, bottomLeft, bottomRight].forEach(sq => {
        if (sq && sq.parentElement) sq.remove();
    });
    topLeft = topRight = bottomLeft = bottomRight = null;

    // remove by class
    document.querySelectorAll('.square').forEach(sq => sq.remove());
}

window.components.startingScreen = new StartingScreen();