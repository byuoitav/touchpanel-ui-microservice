class IndependentAudioModal {
    constructor() {
        this.modal = null;
    }

    async _createModal() {
        this.modal = document.createElement("div");
        this.modal.className = "independent-audio-modal hidden";
        this.modal.innerHTML = `
        <div class="independent-audio-modal-content">
                    <div class="ia-modal-header">
                        <div class="independent-audio-modal-title">Audio Control</div>
                        <button class="audio-btn close-btn btn">Close</button>                    
                    </div>

                    <div class="audio-controls-space">

                    </div>
        </div>
    `;

        // Add event listeners
        const closeBtn = this.modal.querySelector('.close-btn');
        closeBtn.addEventListener("click", () => {
            this.close();
        });

        document.body.appendChild(this.modal);
    }


    open() {
        console.log("Opening Independent Audio Modal");
        if (!this.modal) {
            this._createModal();
        }
        loadComponent('audioControl', `.audio-controls-space`);
        this.modal.classList.remove("hidden");
    }

    close() {
        if (this.modal) this.modal.classList.add("hidden");
    }
}

// Example usage:
// const audioModal = new IndependentAudioModal();
// audioModal.open();