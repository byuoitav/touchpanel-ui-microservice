class IndependentAudioModal {
    constructor() {
        this.modal = null;
        this._injectStyles();
    }

    _injectStyles() {
        if (document.getElementById("independentAudioModalStyles")) return;

        const style = document.createElement("style");
        style.id = "independentAudioModalStyles";
        style.textContent = `
      .independent-audio-modal {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100000;
      }
      .independent-audio-modal.hidden { display: none; }

      .independent-audio-modal-content {
        background: var(--background-color);
        padding: 10px;
        border-radius: 12px;
        width: 95vw;
        height: 94vh;
        text-align: center;
        color: var(--text-color);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        font-size: 1.4rem;

        display: flex;
        flex-direction: column;
      }

      .ia-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 10%;
        border-bottom: 1px;
        border-style: solid;
        border-top: 0;
        border-right: 0;
        border-left: 0;
        padding-bottom: 10px;
        border-color: #6b6d6e;
      }

      .independent-audio-modal-title {
        font-size: 1.5em;
        margin-bottom: 0px;
        font-weight: bold;
      }

      .independent-audio-modal-actions {
        display: flex;
        justify-content: center;
        gap: 10px;
        font-size: 1.4rem;
      }

      .audio-controls-space {
        display: flex;
        height: 100%;
        flex-direction: row;
      }

      .audio-btn {
        padding: 10px 16px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-weight: bold;
        transition: background 0.2s;
      }

      .close-btn {
        background: #ff0000ff;
        color: white;
      }
    `;
        document.head.appendChild(style);
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