const slider = document.querySelector(".volume-slider");
const volumeContainer = document.querySelector(".volume-container");
// make the slider width 75% of the volumeContainer's height
function setSliderWidth() {
    slider.style.width = `${volumeContainer.clientHeight * 0.7}px`;
}

// Set initially
setSliderWidth();

// Update on resize
window.addEventListener('resize', setSliderWidth);

// Function to update the fill of the slider
function updateSliderFill(value) {
  const percentage = (value - slider.min) / (slider.max - slider.min) * 100;
  // get css var --volume-slider-color
    const sliderColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--volume-slider-color').trim() || 'blue';
  // Since we rotated slider -90deg, left to right visually becomes bottom to top
  slider.style.background = `linear-gradient(to right, ${sliderColor} ${percentage}%, #d3d3d3 ${percentage}%)`;
}

// Initialize on load
updateSliderFill(slider.value);

// Update on input
slider.addEventListener("input", function() {
  updateSliderFill(this.value);
});

const sliderLabel = document.getElementById("sliderLabel");
const slideContainer = document.querySelector(".volume-slide-container");
function updateLabelPosition() {
    const percentage = 1 - (slider.value - slider.min) / (slider.max - slider.min);

    const containerRect = slideContainer.getBoundingClientRect();
    const sliderRect = slider.getBoundingClientRect();

    const thumbSize = 40;
    const trackLength = slider.clientWidth - thumbSize;
    const thumbCenterOffset = thumbSize / 2;

    const thumbPos = percentage * trackLength + thumbCenterOffset;

    const offsetTop = (sliderRect.top - containerRect.top) + thumbPos;

    const verticalAdjust = -13; // raise it 

    sliderLabel.style.top = `${offsetTop + verticalAdjust}px`;
    sliderLabel.style.left = `${slideContainer.clientWidth / 2 + 35}px`;

    sliderLabel.textContent = slider.value;
}


// Initialize
updateLabelPosition();

// Update on slider input
slider.addEventListener("input", function() {
    updateSliderFill(this.value);
    updateLabelPosition();
});

// Update on window resize
window.addEventListener("resize", () => {
    setSliderWidth();
    updateLabelPosition();
});