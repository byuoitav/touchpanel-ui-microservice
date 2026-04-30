class StreamInputsModal {
  constructor() {
    this.modal = null;
    this.container = null;
    this.onSelect = null;
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
