class VolumeSlider {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            title: "Master Display Volume",
            icon: null,
            onChange: null,
            muteFunction: null,
            min: 0,
            max: 100,
            value: 50,
            muteText: "Mute",
            id: null,
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
            this.muteButton.classList.toggle("muted");
            if (this.muteButton.classList.contains("muted")) {
                this.muteButton.textContent = "Unmute";
                this.options.muteFunction();
            } else {
                this.muteButton.textContent = this.options.muteText;
                this.options.muteFunction();
            }
        });

        window.addEventListener("resize", () => {
            this.setSliderWidth();
            this.updateLabelPosition();
        });

        this.slider.addEventListener("input", () => {
            let val = Math.round(this.slider.value / 5) * 5;
            this.slider.value = val;
            this.updateSliderFill(val);
            this.updateLabelPosition();
        });

        // Trigger callback only when user releases the slider
        this.slider.addEventListener("change", () => {
            const finalVal = parseInt(this.slider.value);
            if (typeof this.options.onChange === "function") {
                this.options.onChange(finalVal);
            }
        });

    }

    render() {
        let sliderCode = `
        <div class="volume-title">${this.options.title}</div>
        ${this.options.icon ? `<img src="${this.options.icon}" alt="Icon" class="volume-icon">` : ''}
        <div class="volume-slide-container">
            <input type="range" step="5" min="${this.options.min}" max="${this.options.max}" value="${this.options.value}" class="volume-slider">
            <div class="slider-label">${this.options.value}</div>
        </div>
        <button class="mute-button" id="${this.options.id}-mute">${this.options.muteText}</button>
    `;
        // append to container
        this.sliderHTML = document.createElement('div');
        this.sliderHTML.innerHTML = sliderCode;
        this.sliderHTML.classList.add("volume-container");
        this.container.appendChild(this.sliderHTML);
    }


    cacheElements() {
        this.slider = this.sliderHTML.querySelector(".volume-slider");
        this.label = this.sliderHTML.querySelector(".slider-label");
        this.slideContainer = this.sliderHTML.querySelector(".volume-slide-container");
        this.muteButton = this.sliderHTML.querySelector(".mute-button");
    }

    setSliderWidth() {
        this.slider.style.width = `${this.container.clientHeight * 0.65}px`;
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
        const offsetTop = (sliderRect.top - containerRect.top) + thumbCenter - 13; // adjusted upward 13px

        this.label.style.position = "absolute";
        this.label.style.left = `${this.slideContainer.clientWidth / 2 + 30}px`;
        this.label.style.top = `${offsetTop}px`;
        this.label.textContent = this.slider.value;
    }

    setValue(newValue, triggerCallback = true) {
        // Round to nearest multiple of 5
        const roundedValue = Math.max(this.options.min, Math.min(this.options.max, Math.round(newValue / 5) * 5));
        this.slider.value = roundedValue;
        this.updateSliderFill(roundedValue);
        this.updateLabelPosition();

        if (triggerCallback && typeof this.options.onChange === "function") {
            this.options.onChange(roundedValue);
        }
    }

}


