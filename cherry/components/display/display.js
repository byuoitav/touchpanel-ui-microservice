window.components = window.components || {};

window.components.display = {
  selectedDisplays: [],
  inputsAvailableForCurrentDisplay: [],
  selectedInputs: [],
  displays: [],
  inputs: [],
  masterVolume: null,

  loadPage: function () {
    const preset = window.DataService.panel.preset;
    this.displays = preset.displays;
    this.inputs = preset.inputs;
    this.inputsAvailableForCurrentDisplay = [];
    this.render();
    this.updateDisplaysAndInputs();
  },

  cleanup: function () {
  },

  updateDisplaysAndInputs: function () {
    if (window.DataService.panel && window.DataService.panel.preset) {
      this.displays = [...window.DataService.panel.preset.displays.filter((d) => !d.hidden)];

      // Automatically select the first display if none are selected
      if (this.displays.length > 0 && this.selectedDisplays.length === 0) {
        this.toggleDisplay(this.displays[0]);
        this.selectInput(this.displays[0].input ? this.displays[0].input.name : "BLANK");
      }
    }
  },

  updateUI: function (displayName, inputDisplayName, inputIcon) {
    // check if display is blanked
    const display = this.displays.find(d => d.name === displayName);
    this.selectOutput(displayName);

    // update the display's input text
    const inputText = document.getElementById(`${displayName}-input`);
    if (inputText) {
      inputText.textContent = inputDisplayName;
      // input = this.inputs.find(i => i.name === inputName);
      // inputText.textContent = input ? input.displayname : inputName;
    }

    // update the display's icon
    console.log("Input icon:", inputIcon);
    loadSvg(`${displayName}-image`, `./assets/${inputIcon}.svg`);
  },

  toggleDisplay: function (display) {
    this.selectedDisplays = [];
    this.selectedDisplays.push(display);
    this.getInputsForCurrentDisplay(display);
    this.selectOutput(display.name);
  },

  changeInput(input) {
    if (input.id === "BLANK") {
      window.CommandService.setBlank(true, this.selectedDisplays);
      return;
    } else {
      window.CommandService.setInput(window.DataService.panel.preset, input, this.selectedDisplays);
    }
  },

  getInputsForCurrentDisplay: function (display) {
    const tempInputs = [];

    for (const [key, value] of Object.entries(window.DataService.inputReachability)) {
      if (value.includes(display.name)) {
        tempInput = window.DataService.panel.preset.inputs.find((i) => i.name === key);
        if (tempInput) {
          tempInputs.push(tempInput);
        }
      }
    }

    this.inputsAvailableForCurrentDisplay = tempInputs;

    // for all inputs, if it is not in the current display's inputs, add the unselectable class, otherwise remove it
    const allInputs = document.querySelectorAll('.input');
    allInputs.forEach(input => {
      if (!tempInputs.some(i => i && i.name === input.id) && input.id !== "BLANK") {
        input.classList.add('unselectable');
      } else {
        input.classList.remove('unselectable');
      }
    });
  },

  render: function () {
    const separateInputs = this.separateInputs(window.DataService.panel);

    const container = document.querySelector('.inputs-outputs-container');
    container.innerHTML = `
      ${this.renderOutputs(this.displays)}
      ${this.renderInputs(separateInputs ? this.inputs : window.DataService.panel.preset.inputs)}
      ${this.renderRecording()}
    `;
    

    this.renderSvgs(this.displays, this.inputs);

    // carousel logic for possible overflow
    this.setupCarousel(container.querySelector('.inputs-carousel-container'), '.inputs-page');
    this.setupCarousel(container.querySelector('.outputs-carousel-container'), '.outputs-page');

    // Add Listeners for outputs and inputs
    this.addOutputInputListeners();

    const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);
    const MasterVolume = new VolumeSliderClass(document.querySelector('.volume-control-container'), {
      title: "Master Display Volume",
      id: "master",
      value: 30,
      onChange: (val) => {
        console.log("Master volume changed to:", val);
        window.CommandService.setMasterVolume(val, window.DataService.panel.preset);
        // Update the master volume slider on the audio control page
        const masterVolume = window.components.audioControl.sliders.find(slider => slider.options.id === "master");
        if (masterVolume) {
          masterVolume.setValue(val, false);
        }
      },
      muteFunction: () => {
        if (MasterVolume.muteButton.classList.contains("muted")) {
          window.CommandService.setMasterMute(true, window.DataService.panel.preset);
          // update mute button on the audio control page
          window.components.audioControl.sliders.find(slider => slider.options.id === "master").toggleMuteAppearance();
        } else {
          window.CommandService.setMasterMute(false, window.DataService.panel.preset);
          // update mute button on the audio control page
          window.components.audioControl.sliders.find(slider => slider.options.id === "master").toggleMuteAppearance();
        }
      },
    });

    this.masterVolume = MasterVolume;

  },

  addOutputInputListeners: function () {
    const outputs = document.querySelectorAll('.output');
    outputs.forEach(output => {
      output.addEventListener('click', () => {
        window.CommandService.buttonPress(`clicked output ${output.id}`, {});
        const display = this.displays.find(d => d.name === output.id);
        this.toggleDisplay(display);
        this.selectInput(display.input ? display.input.name : "BLANK");
      });
    });

    const inputs = document.querySelectorAll('.input');
    inputs.forEach(input => {
      input.addEventListener('click', () => {
        window.CommandService.buttonPress(`clicked input ${input.id}`, {});

        console.log("Inputs Available for Current Display:", this.inputsAvailableForCurrentDisplay);
        console.log("Selected Input:", input);

        selectedInput = this.inputsAvailableForCurrentDisplay.find(i => i.name === input.id) || input;

        // if it has subInputs, bring up the modal and let them choose a stream source
        if (selectedInput.subInputs && selectedInput.subInputs.length > 0) {
          window.StreamInputsModal = new StreamInputsModal();
          window.StreamInputsModal.open(selectedInput.subInputs, selected => {
            this.changeInput(selected);
            this.selectInput(input.id);

            const currentDisplay = this.selectedDisplays[0];
            window.DataService.updateDeviceState("input", selected.name, currentDisplay.name);
          });
        }
        // if it doesn't have subInputs, just change the input normally
        else {
          this.selectInput(input.id);

          this.changeInput(selectedInput);
          const currentDisplay = this.selectedDisplays[0];
          window.DataService.updateDeviceState("input", input.id, currentDisplay.name);
        }
      });
    });

    // Add event listeners for device state updates
    window.DataService.addEventListener('deviceStateUpdate', (e) => {
      let target = (e.TargetDevice && e.TargetDevice.DeviceID || "").split("-");
      if (!target || target.length < 3) return;
    });
  },

  selectInput: function (inputName) {
    const inputs = document.querySelectorAll('.input');

    inputs.forEach(input => {
      input.classList.remove('selected-io');
    });
    const selectedInput = document.getElementById(inputName);
    if (selectedInput) {
      selectedInput.classList.add('selected-io');
    }
  },

  selectOutput: function (outputName) {
    const outputs = document.querySelectorAll('.output');
    outputs.forEach(output => {
      output.classList.remove('selected-io');
    });
    const selectedOutput = document.getElementById(outputName);
    if (selectedOutput) {
      selectedOutput.classList.add('selected-io');
    }
  },

  // determines if "displaysSeparateInputs" exists in config's features
  separateInputs: function (panel) {
    return panel.features.includes("displaysSeparateInputs");
  },

  renderSvgs: function (displays, inputs) {
    displays.forEach(display => {
      loadSvg(`${display.name}-image`, `./assets/${display.icon}.svg`);
    });
    inputs.forEach(input => {
      loadSvg(`${input.name}-image`, `./assets/${input.icon}.svg`);
    });
    loadSvg('BLANK-image', `./assets/blank.svg`);
  },

  renderOutputs: function (outputs) {
    // Group outputs into rows of 4
    const outputGroups = [];
    for (let i = 0; i < outputs.length; i += 4) {
      outputGroups.push(outputs.slice(i, i + 4));
    }

    // Each outputs-page contains one outputs-row
    const outputPages = outputGroups.map(group => `
      <div class="outputs-row">
      ${group.map(output => `
        <div class="output" id="${output.name}">
        <div class="output-title">${output.displayname}</div>
        <div id="${output.name}-image" alt="${output.displayname}" class="output-image"></div>
        <div class="current-input-name" id="${output.name}-input">${output.input ? output.input.displayname : ''}</div>
        </div>
      `).join('')}
      </div>
    `);

    // Carousel HTML structure for outputs
    return `
      <div class="outputs-carousel-container">
        <img class="carousel-arrow outputs-carousel-arrow-left" src="assets/arrow_left.svg" alt="Previous">
        <img class="carousel-arrow outputs-carousel-arrow-right" src="assets/arrow_right.svg" alt="Next" style="${outputPages.length > 1 ? '' : 'display:none;'}">
        <div class="outputs-carousel-track">
          ${outputPages.map(page => `
            <div class="outputs-page">
              ${page}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderInputs: function (inputs) {
    const blankInput = {
      "name": "BLANK",
      "displayname": "Blank",
      "icon": "blank",
      "subInputs": [],
      "events": {}
    };

    const allInput = [blankInput, ...inputs];

    // separate the inputs into groups of 6
    const inputGroups = [];
    for (let i = 0; i < allInput.length; i += 6) {
      inputGroups.push(allInput.slice(i, i + 6));
    }

    // for each group, create a row of inputs
    const inputRows = inputGroups.map(group => `
      <div class="inputs-row">
        ${group.map(input => `
          <div class="input" id="${input.name}">
            <div id="${input.name}-image" alt="${input.displayname}" class="input-image"></div>
            <div class="input-title">${input.displayname}</div>
          </div>
        `).join('')}
      </div>
    `);

    // for every two rows, create an inputs-page
    const inputPages = [];
    for (let i = 0; i < inputRows.length; i += 2) {
      inputPages.push(inputRows.slice(i, i + 2));
    }

    // if there is more than one row, align pages to start; otherwise center
    const inputsPageJustifyContent = inputRows.length > 1 ? 'start' : 'center';

    // Carousel HTML structure
    return `
      <div class="inputs-carousel-container">
        <img class="carousel-arrow carousel-arrow-left" src="assets/arrow_left.svg" alt="Previous">
        <img class="carousel-arrow carousel-arrow-right" src="assets/arrow_right.svg" alt="Next" style="${inputPages.length > 1 ? '' : 'display:none;'}">
        <div class="inputs-carousel-track">
          ${inputPages.map((page, idx) => `
            <div class="inputs-page" style="justify-content: ${inputsPageJustifyContent};">
              ${page.join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // makes the recording button in the bottom left corner
  renderRecording: function () {
    if (!window.DataService.panel.preset.recording.start) return '';
    return `
      <div class="recording-container">
        <img class="record-btn" src="assets/record_button.svg" alt="Record" onclick="window.components.display.toggleRecording()">
        <p class="recording-text">Record</p>
      </div>
    `;
  },

  // toggle recording 
  toggleRecording: function () {
    console.log("Toggling recording");
    const recordBtn = document.querySelector('.record-btn');
    const recordText = document.querySelector('.recording-text');
    if (recordBtn.classList.contains('recording')) {
      window.CommandService.stopRecording();
      recordBtn.classList.remove('recording');
      recordText.textContent = 'Record';
      recordBtn.src = 'assets/record_button.svg';
    } else {
      window.CommandService.startRecording();
      recordBtn.classList.add('recording');
      recordText.textContent = 'Recording...';
      recordBtn.src = 'assets/record_button_square.svg';
    }
  },

  // if there are a ton of outputs or inputs, this makes a carousel that can carry them all
  setupCarousel: function (carouselContainer, pageSelector) {
    if (!carouselContainer) return;
    const track = carouselContainer.querySelector('[class$="-carousel-track"]');
    const leftArrow = carouselContainer.querySelector('.carousel-arrow-left, .outputs-carousel-arrow-left');
    const rightArrow = carouselContainer.querySelector('.carousel-arrow-right, .outputs-carousel-arrow-right');
    const pages = track.querySelectorAll(pageSelector);
    let currentPage = 0;
    function updateArrows() {
      leftArrow.style.display = currentPage > 0 ? '' : 'none';
      rightArrow.style.display = currentPage < pages.length - 1 ? '' : 'none';
    }
    function goToPage(idx) {
      currentPage = idx;
      track.style.transform = `translateX(-${100 * currentPage}%)`;
      updateArrows();
    }
    leftArrow.addEventListener('click', () => {
      window.CommandService.buttonPress(`clicked left arrow on ${carouselContainer.classList.contains('outputs-carousel-container') ? 'outputs' : 'inputs'} carousel`, {});
      if (currentPage > 0) goToPage(currentPage - 1);
    });
    rightArrow.addEventListener('click', () => {
      window.CommandService.buttonPress(`clicked right arrow on ${carouselContainer.classList.contains('outputs-carousel-container') ? 'outputs' : 'inputs'} carousel`, {});
      if (currentPage < pages.length - 1) goToPage(currentPage + 1);
    });
    updateArrows();
  },
};
