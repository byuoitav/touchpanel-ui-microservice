class HelpModal {
    constructor() {
        this.modal = null;
        this.APIService = new APIService();
    }

    _createModal() {
        this.modal = document.createElement("div");
        this.modal.className = "help-modal hidden";

        const { titleText, bodyText, requestEnabled, requestLabel, dismissLabel } = this._resolveMessage();

        const content = document.createElement("div");
        content.className = "help-modal-content";

        const title = document.createElement("h2");
        title.classList.add("help-modal-title");
        title.textContent = titleText || "Help";

        const message = document.createElement("p");
        message.textContent = bodyText;

        const actions = document.createElement("div");
        actions.className = "help-modal-actions";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "help-btn cancel-btn btn";
        cancelBtn.textContent = dismissLabel || "Close";

        cancelBtn.addEventListener("click", () => {
            window.CommandService.buttonPress("clicked close help modal", {});
            this.close();
        });

        if (requestEnabled) {
            const requestBtn = document.createElement("button");
            requestBtn.className = "help-btn request-btn btn";
            requestBtn.textContent = requestLabel || "Request Help";
            requestBtn.addEventListener("click", async () => {
                window.CommandService.buttonPress("clicked request help", {});
                let resp = await this.requestHelp();
                if (resp.status != 200) {
                    message.textContent = "Failed to request help, call " + window.themeService.phoneNumber + " for support.";
                    // remove request button and edit text from "cancel" to "close"
                    actions.removeChild(requestBtn);
                    cancelBtn.textContent = dismissLabel || "Close";
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

    _resolveMessage() {
        const fallback = {
            titleText: "Help",
            bodyText: `Please call AV Support at ${window.themeService?.phoneNumber || ""} for help.`,
            requestEnabled: true,
            requestLabel: "Request Help",
            dismissLabel: "Cancel"
        };

        const schedule = window.HelpService?.schedule;
        if (!schedule) return fallback;

        const phone = schedule.phoneNumber || window.themeService?.phoneNumber || "";

        // choose message: open by default, override if within a closure window
        const closedKey = this._currentClosureMessage(schedule);
        const msg = closedKey ? schedule.closedMessages[closedKey] : schedule.openMessage;
        if (!msg) return fallback;

        const body = (msg.message || "").replace("${phoneNumber}", phone);

        return {
            titleText: msg.title || "Help",
            bodyText: body,
            requestEnabled: !!msg.requestButton,
            requestLabel: msg.requestButtonLabel || "Request Help",
            dismissLabel: msg.dismissButtonLabel || (msg.requestButton ? "Cancel" : "Close")
        };
    }

    _currentClosureMessage(schedule) {
        const now = new Date();
        const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const day = dayNames[now.getDay()];
        const current = this._timeString(now);

        for (const closure of schedule.closures || []) {
            if (!closure.days || !closure.days.includes(day)) continue;
            if (this._timeInRange(current, closure.from, closure.to)) {
                return closure.message;
            }
        }
        return null;
    }

    _timeString(d) {
        const h = String(d.getHours()).padStart(2, "0");
        const m = String(d.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
    }

    _timeInRange(current, from, to) {
        if (!from || !to) return false;
        // Simple lexicographic compare works with HH:MM strings
        return current >= from && current < to;
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
