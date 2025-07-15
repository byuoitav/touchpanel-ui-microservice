window.components = window.components || {};

window.components.display = {
  loadPage: function () {
    const dataService = window.DataService;

    // wait for dataService to finish loading
    this.render();
  },

  cleanup: function () {
    // optional cleanup
  },

  render: function () {
    const preset = window.DataService.panel.preset;
    const container = document.querySelector('.inputs-outputs-container');
    container.innerHTML = `
      ${this.renderOutputs(preset.displays)}
      ${this.renderInputs(preset.inputs)}
      ${this.renderRecording()}
    `;

    // Inputs carousel logic
    const carouselContainer = container.querySelector('.inputs-carousel-container');
    if (carouselContainer) {
      const track = carouselContainer.querySelector('.inputs-carousel-track');
      const leftArrow = carouselContainer.querySelector('.carousel-arrow-left');
      const rightArrow = carouselContainer.querySelector('.carousel-arrow-right');
      const pages = track.querySelectorAll('.inputs-page');
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
    }

    // Outputs carousel logic
    const outputsCarousel = container.querySelector('.outputs-carousel-container');
    if (outputsCarousel) {
      const track = outputsCarousel.querySelector('.outputs-carousel-track');
      const leftArrow = outputsCarousel.querySelector('.outputs-carousel-arrow-left');
      const rightArrow = outputsCarousel.querySelector('.outputs-carousel-arrow-right');
      const pages = track.querySelectorAll('.outputs-page');
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
    }

    const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);
    const MasterVolume = new VolumeSliderClass(document.querySelector('.volume-control-container'), {
      title: "Master Display Volume",
      value: 37
    });
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
            <img src="assets/${output.icon || 'videocam'}.svg" alt="${output.displayname}" class="output-image">
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
            <img src="assets/${input.icon || 'settings_input.hdmi'}.svg" alt="${input.displayname}" class="input-image">
            <div class="input-title">${input.displayname}</div>
          </div>
        `).join('')}
      </div>
    `);

    // for every two rows, create a inputs-page
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

  renderRecording: function () {
    return `
      <div class="recording-container">
        <img class="record-btn" src="assets/record_button.svg" alt="Record">
        <p class="recording-text">Record</p>
      </div>
    `;
  },
};
