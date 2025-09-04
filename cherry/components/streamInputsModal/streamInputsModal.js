class StreamInputsModal {
  constructor() {
    this.modal = null;
    this.container = null;
    this.onSelect = null;
    this._injectStyles();
  }

  _injectStyles() {
    if (document.getElementById("streamInputsModalStyles")) return;

    const style = document.createElement("style");
    style.id = "streamInputsModalStyles";
    style.textContent = `
      .stream-inputs-modal {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .stream-inputs-modal.hidden { display: none; }
      .stream-modal-content {
        background: var(--background-color);
        padding: 20px;
        border-radius: 12px;
        height: 70%;
        max-width: 900px;
        width: 100%;
        text-align: center;
        color: var(--text-color);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);

        display: flex;              
        flex-direction: column;      
      }

      .stream-options {
        flex: 1;                     
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
      }

      .stream-option {
        flex: 1;                     /* each option fills equal vertical space */
        display: flex;               /* center label */
        align-items: center;
        justify-content: center;
        border: 0px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        background: var(--background-color-accent);
        transition: background 0.2s, transform 0.1s;
        font-size: 1.4rem;
      }

      .stream-option:hover {
        background: var(--background-color-accent);
        transform: scale(1.02);
      }

      .cancel-stream-btn {
        background: #ff0000ff;
        color: white;
        border: none;
        padding: 20px 26px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.2rem;
        transition: background 0.2s;
      }

      .cancel-stream-btn:hover { background: #888; }
    `;
    document.head.appendChild(style);
  }

  _createModal() {
    this.modal = document.createElement("div");
    this.modal.className = "stream-inputs-modal hidden";

    const content = document.createElement("div");
    content.className = "stream-modal-content";

    const title = document.createElement("h2");
    title.textContent = "Select a Stream";

    this.container = document.createElement("div");
    this.container.className = "stream-options";

    const actions = document.createElement("div");
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel-stream-btn btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      window.CommandService.buttonPress("clicked cancel stream selection", {});
      this.close();
    });

    actions.appendChild(cancelBtn);
    content.append(title, this.container, actions);
    this.modal.appendChild(content);

    document.body.appendChild(this.modal);
  }

  open(streams, callback) {
    if (!this.modal) this._createModal();

    this.container.innerHTML = "";
    this.onSelect = callback;

    streams.forEach(stream => {
      const option = document.createElement("div");
      option.className = "stream-option btn";
      option.textContent = stream.displayname || stream.name;
      option.addEventListener("click", () => {
        window.CommandService.buttonPress(`clicked ${stream.name} stream`, {
          streamName: stream.name,
          streamDisplayName: stream.displayname || stream.name
        });
        this.close();
        if (this.onSelect) this.onSelect(stream);
      });
      this.container.appendChild(option);
    });

    this.modal.classList.remove("hidden");
  }

  close() {
    if (this.modal) this.modal.classList.add("hidden");
  }
}

// Example usage:
// const modal = new StreamInputsModal();
// modal.open(streamList, selected => console.log("Selected:", selected));
