window.components = window.components || {};

window.components.display = {
  selectedDisplays: [],
  inputsAvailableForCurrentDisplay: [],
  selectedInputs: [],
  displays: [],
  inputs: [],

  loadPage: function () {
    const preset = window.DataService.panel.preset;
    this.displays = preset.displays;
    this.inputs = preset.inputs;
    this.inputsAvailableForCurrentDisplay = [];

    this.render();
    this.updateDisplaysAndInputs();

  },

  cleanup: function () {
    // optional cleanup
  },

  updateDisplaysAndInputs: function () {
    console.log("Updating displays and inputs");
    if (window.DataService.panel && window.DataService.panel.preset) {
      console.log("Updating displays and inputs from preset");
      this.displays = [...window.DataService.panel.preset.displays.filter((d) => !d.hidden)];

      // Automatically select the first display if none are selected
      if (this.displays.length > 0 && this.selectedDisplays.length === 0) {
        this.toggleDisplay(this.displays[0]);
      }
    }
  },

  toggleDisplay: function (display) {
    console.log("Toggling display:", display);
    this.selectedDisplays = [];
    this.selectedDisplays.push(display);
    this.getinputsAvailableForCurrentDisplay(display);
    this.selectOutput(display.name);
  },

  changeInput(input) {
    // TODO: if it has subInputs do the StreamModalComponent thingy
    if (input.id === "BLANK") {
      console.log("Blanking displays:", this.selectedDisplays);
      window.CommandService.setBlank(true, this.selectedDisplays);
      return;
    } else {
      window.CommandService.setInput(window.DataService.panel.preset, input, this.selectedDisplays);
    }

  },

  getinputsAvailableForCurrentDisplay: function (display) {
    const tempInputs = [];
    console.log("Getting inputs for display:", display.name);
    console.log("inputReachability:", window.DataService.inputReachability);

    for (const [key, value] of Object.entries(window.DataService.inputReachability)) {
      if (value.includes(display.name)) {
        tempInputs.push(window.DataService.panel.preset.inputs.find((i) => i.name === key));
      }
    }
    console.log("Inputs for display:", tempInputs);
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
    const container = document.querySelector('.inputs-outputs-container');
    container.innerHTML = `
      ${this.renderOutputs(this.displays)}
      ${this.renderInputs(this.inputs)}
      ${this.renderRecording()}
    `;

    this.renderSvgs(this.displays, this.inputs);

    // expanded carousel logic
    this.setupCarousel(container.querySelector('.inputs-carousel-container'), '.inputs-page');
    this.setupCarousel(container.querySelector('.outputs-carousel-container'), '.outputs-page');

    // Add Listeners for outputs and inputs
    this.addOutputInputListeners();

    const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);
    const MasterVolume = new VolumeSliderClass(document.querySelector('.volume-control-container'), {
      title: "Master Display Volume",
      value: 37
    });
  },

  addOutputInputListeners: function () {
    const outputs = document.querySelectorAll('.output');
    outputs.forEach(output => {
      output.addEventListener('click', () => {
        console.log("Selected output:", output.id);
        this.toggleDisplay(this.displays.find(d => d.name === output.id));
        window.DataService.updateDeviceState("input", output.id, output.id);
      });
    });

    const inputs = document.querySelectorAll('.input');
    inputs.forEach(input => {
      input.addEventListener('click', () => {
        console.log("Selected input:", input.id);
        this.selectDisplay(input.id);
        this.changeInput(this.inputsAvailableForCurrentDisplay.find(i => i.name === input.id) || input);
        window.DataService.updateDeviceState("input", input.id, input.id);
      });
    });

    // Add event listeners for device state updates
    window.DataService.addEventListener('deviceStateUpdate', (e) => {
      let target = (e.TargetDevice && e.TargetDevice.DeviceID || "").split("-");
      if (!target || target.length < 3) return;
    });

  },

  selectDisplay: function (inputName) {
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

    // Carousel HTML structure
    return `
      <div class="inputs-carousel-container">
        <img class="carousel-arrow carousel-arrow-left" src="assets/arrow_left.svg" alt="Previous">
        <img class="carousel-arrow carousel-arrow-right" src="assets/arrow_right.svg" alt="Next" style="${inputPages.length > 1 ? '' : 'display:none;'}">
        <div class="inputs-carousel-track">
          ${inputPages.map((page, idx) => `
            <div class="inputs-page">
              ${page.join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // makes the recording button in the bottom left corner
  renderRecording: function () {
    return `
      <div class="recording-container">
        <img class="record-btn" src="assets/record_button.svg" alt="Record">
        <p class="recording-text">Record</p>
      </div>
    `;
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
      if (currentPage > 0) goToPage(currentPage - 1);
    });
    rightArrow.addEventListener('click', () => {
      if (currentPage < pages.length - 1) goToPage(currentPage + 1);
    });
    updateArrows();
  },
};
