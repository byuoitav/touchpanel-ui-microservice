class VolumeSlider {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            title: "Master Display Volume",
            min: 0,
            max: 100,
            value: 50,
            muteText: "Mute",
            ...options
        };

        this.render();
        this.cacheElements();
        this.setSliderWidth();
        this.updateSliderFill(this.slider.value);
        this.updateLabelPosition();

        this.slider.addEventListener("input", () => {
            this.updateSliderFill(this.slider.value);
            this.updateLabelPosition();
        });

        this.muteButton.addEventListener("click", () => {
            this.slider.value = this.options.min;
            this.updateSliderFill(this.slider.value);
            this.updateLabelPosition();
        });

        window.addEventListener("resize", () => {
            this.setSliderWidth();
            this.updateLabelPosition();
        });
    }

    render() {
        this.container.innerHTML = `
            <div class="volume-title">${this.options.title}</div>
            <div class="volume-slide-container">
                <input type="range" min="${this.options.min}" max="${this.options.max}" value="${this.options.value}" class="volume-slider">
                <div class="slider-label">${this.options.value}</div>
            </div>
            <button class="mute-button">${this.options.muteText}</button>
        `;
    }

    cacheElements() {
        this.slider = this.container.querySelector(".volume-slider");
        this.label = this.container.querySelector(".slider-label");
        this.slideContainer = this.container.querySelector(".volume-slide-container");
        this.muteButton = this.container.querySelector(".mute-button");
    }

    setSliderWidth() {
        this.slider.style.width = `${this.container.clientHeight * 0.7}px`;
    }

    updateSliderFill(value) {
        const percent = (value - this.slider.min) / (this.slider.max - this.slider.min) * 100;
        const color = getComputedStyle(document.documentElement).getPropertyValue('--volume-slider-color').trim() || 'blue';
        this.slider.style.background = `linear-gradient(to right, ${color} ${percent}%, #d3d3d3 ${percent}%)`;
    }

    updateLabelPosition() {
        const percent = 1 - (this.slider.value - this.slider.min) / (this.slider.max - this.slider.min);
        const thumbSize = 40;
        const trackLen = this.slider.clientWidth - thumbSize;
        const thumbCenter = percent * trackLen + (thumbSize / 2);

        const containerRect = this.slideContainer.getBoundingClientRect();
        const sliderRect = this.slider.getBoundingClientRect();
        const offsetTop = (sliderRect.top - containerRect.top) + thumbCenter - 13; // adjusted upward 5px

        this.label.style.position = "absolute";
        this.label.style.left = `${this.slideContainer.clientWidth / 2 + 30}px`;
        this.label.style.top = `${offsetTop}px`;
        this.label.textContent = this.slider.value;
    }
}
