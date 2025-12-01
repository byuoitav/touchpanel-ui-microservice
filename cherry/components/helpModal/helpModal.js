class HelpModal {
    constructor() {
        this.modal = null;
        this._injectStyles();
        this.APIService = new APIService();
    }

    _injectStyles() {
        if (document.getElementById("helpModalStyles")) return;

        const style = document.createElement("style");
        style.id = "helpModalStyles";
        style.textContent = `
      .help-modal {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100000;
      }
      .help-modal.hidden { display: none; }

      .help-modal-content {
        background: var(--background-color);
        padding: 20px;
        border-radius: 12px;
        max-width: 500px;
        width: 100%;
        text-align: center;
        color: var(--text-color);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        font-size: 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .help-modal-title {
        font-size: 1.5em;
        margin-bottom: 0px;
      }

      .help-modal-actions {
        display: flex;
        justify-content: center;
        gap: 10px;
        font-size: 1.4rem;
      }

      .help-btn {
        padding: 10px 16px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-weight: bold;
        transition: background 0.2s;
      }

      .cancel-btn {
        background: #ff0000ff;
        color: white;
      }

      .request-btn {
        background: var(--background-color-accent);
        color: var(--text-color);
      }
    `;
        document.head.appendChild(style);
    }

    _createModal() {
        this.modal = document.createElement("div");
        this.modal.className = "help-modal hidden";

        const content = document.createElement("div");
        content.className = "help-modal-content";

        const title = document.createElement("h2");
        title.classList.add("help-modal-title");
        title.textContent = "Help";

        const message = document.createElement("p");
        if (!this.isAfterHours()) {
            message.textContent = `Please call AV Support at ${window.themeService.phoneNumber} for help, or request help by pressing Request Help to send support staff to you.`;
        } else {
            message.textContent = `No technicians are currently available. For emergencies please call ${window.themeService.phoneNumber}.`;
        }

        const actions = document.createElement("div");
        actions.className = "help-modal-actions";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "help-btn cancel-btn btn";
        if (!this.isAfterHours()) {
            cancelBtn.textContent = "Cancel"
        } else {
            cancelBtn.textContent = "Close"
        }

        cancelBtn.addEventListener("click", () => {
            window.CommandService.buttonPress("clicked close help modal", {});
            this.close();
        });

        if (!this.isAfterHours()) {
            const requestBtn = document.createElement("button");
            requestBtn.className = "help-btn request-btn btn";
            requestBtn.textContent = "Request Help";
            requestBtn.addEventListener("click", async () => {
                window.CommandService.buttonPress("clicked request help", {});
                let resp = await this.requestHelp();
                if (resp.status != 200) {
                    message.textContent = "Failed to request help, call " + window.themeService.phoneNumber + " for support.";
                    // remove request button and edit text from "cancel" to "close"
                    actions.removeChild(requestBtn);
                    cancelBtn.textContent = "Close";
                } else {
                    message.textContent = "Your help request has been received; A member of our support staff is on their way.";
                    this.createCloseButton();
                }
            });


            actions.append(cancelBtn, requestBtn);

        } else {
            actions.append(cancelBtn);
        }

        content.append(title, message, actions);
        this.modal.appendChild(content);

        document.body.appendChild(this.modal);
    }

    createCloseButton() {
        const actions = document.querySelector(".help-modal-actions");

        // clear old buttons
        actions.innerHTML = "";

        const closeBtn = document.createElement("button");
        closeBtn.className = "help-btn cancel-btn btn";
        closeBtn.textContent = "Close";
        closeBtn.addEventListener("click", async () => {
            window.CommandService.buttonPress("clicked close help request", {});
            this.close();
        });

        actions.append(closeBtn);
    }

    isAfterHours() {
        let date = new Date();
        let DayOfTheWeek = date.getDay();
        let CurrentHour = date.getHours();

        switch (DayOfTheWeek) {
            // Sunday
            case 0: { return true; }
            // Monday
            case 1: {
                if (CurrentHour < 7 || CurrentHour >= 19) { return true; }
                else { return false; }
            }
            // Tuesday
            case 2: {
                if (CurrentHour < 7 || CurrentHour >= 21) { return true; }
                else { return false; }
            }
            // Wednesday
            case 3: {
                if (CurrentHour < 7 || CurrentHour >= 21) { return true; }
                else { return false; }
            }
            // Thursday
            case 4: {
                if (CurrentHour < 7 || CurrentHour >= 21) { return true; }
                else { return false; }
            }
            // Friday
            case 5: {
                if (CurrentHour < 7 || CurrentHour >= 20) { return true; }
                else { return false; }
            }
            // Saturday
            case 6: {
                if (CurrentHour < 8 || CurrentHour >= 12) { return true; }
                else { return false; }
            }
            default: { return false; }
        }
    }

    async requestHelp() {
        console.log("requesting help");
        let resp = await this.APIService.help("help");
        if (!resp) {
            return { status: 500 };
        }   
        resp = await this.APIService.help("confirm");
        return resp;
    }

    open() {
        if (!this.modal) this._createModal();
        this.modal.classList.remove("hidden");
        createZPattern();
    }

    close() {
        if (this.modal) { 
            // remove it from dom
            this.modal.remove();
            this.modal = null;
        }
        removeZPattern();
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

function createZPattern() {
    topLeft = createSquare('top-left', () => {
        if (!topRight) {
            topRight = createSquare('top-right', () => {
                if (!bottomLeft) {
                    bottomLeft = createSquare('bottom-left', () => {
                        if (!bottomRight) {
                            bottomRight = createSquare('bottom-right', () => {
                                window.location.href = "http://" + location.hostname + ':10000/dashboard/overview';
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

// Example usage:
// const helpModal = new HelpModal();
// helpModal.open();
