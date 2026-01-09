window.components = window.components || {};

window.components.audioControl = {
    sliders: [],

    loadPage: function () {
        this.populateMasterVolume();
        this.populateDisplayVolumes();
        this.populateMicrophoneVolumes();
        this.populateAudioGroupings();
        this.initPagination();

        // Generic tab listeners for all audio tabs
        document.querySelectorAll('.audio-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                window.CommandService.buttonPress(`clicked ${tab.textContent} tab on audio control`, {});
                // Remove active class from all tabs
                document.querySelectorAll('.audio-tab').forEach(t => t.classList.remove('active-audio-tab'));
                tab.classList.add('active-audio-tab');

                // Hide all content sections
                document.querySelectorAll('.audio-controls-content-wrapper').forEach(section => section.classList.add('hidden'));

                // Show the content section corresponding to this tab
                // For displays and microphones, use their wrappers
                let contentClass = tab.className.split(' ').find(cls => cls.endsWith('-tab'));
                if (contentClass) {
                    let base = contentClass.replace('-tab', '');
                    let contentSelector = `.${base}-audio-controls-wrapper`;
                    let contentSection = document.querySelector(contentSelector);
                    if (contentSection) {
                        contentSection.classList.remove('hidden');
                    }
                }
                this.resetVolumeSliderHeights();
            });
        });
    },

    cleanup: function () {
        // Cleanup logic if needed
    },

    populateMasterVolume: function () {
        const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);

        const MasterVolume = new VolumeSliderClass(document.querySelector('.master-volume-container'), {
            title: "Master Display Volume",
            id: "master",
            value: 30,
            onChange: (val) => {
                console.log("Master volume changed to:", val);
                window.CommandService.setMasterVolume(val, window.DataService.panel.preset);
                // Update the master volume slider on the display page
                const masterVolume = window.components.display.masterVolume;
                if (masterVolume) {
                    masterVolume.setValue(val, false);
                }

            },
            muteFunction: () => {
                if (MasterVolume.muteButton.classList.contains("muted")) {
                    window.CommandService.setMasterMute(false, window.DataService.panel.preset);
                    // update mute button on the displays page
                    if (window.components.display && window.components.display.masterVolume) {
                        window.components.display.masterVolume.toggleMuteAppearance();
                    }
                } else {
                    window.CommandService.setMasterMute(true, window.DataService.panel.preset);
                    // update mute button on the displays page
                    if (window.components.display && window.components.display.masterVolume) {
                        window.components.display.masterVolume.toggleMuteAppearance();
                    }
                }
            }
        });

        this.sliders.push(MasterVolume);
    },

    populateDisplayVolumes: function () {
        console.log("Preset", window.DataService.panel.preset);
        const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);
        const displaysTab = document.querySelector('.displays-tab');
        const displaysAudioControls = document.querySelector('.displays-audio-controls');

        if (window.DataService.panel.preset.displays.length === 0) {
            displaysTab.classList.add('hidden');
            displaysAudioControls.classList.add('hidden');
            console.warn("No displays found in the preset.");
            return;
        }

        const audioDevices = window.DataService.panel.preset.audioDevices;
        if (audioDevices.length === 0) {
            displaysTab.classList.add('hidden');
            displaysAudioControls.classList.add('hidden');
            console.warn("No audio devices found in the preset.");
            return;
        }

        for (const device of audioDevices) {
            const volumeSlider = new VolumeSliderClass(document.querySelector('.displays-audio-controls'), {
                title: device.displayname,
                value: device.mixlevel,
                icon: `./assets/${device.icon}.svg` || null,
                onChange: (val) => {
                    console.log(`Volume for ${device.displayname} changed to:`, val);
                    window.CommandService.setMixLevel(val, device, window.DataService.panel.preset);
                    window.CommandService.setMixMute(false, device, window.DataService.panel.preset);
                },
                muteFunction: () => {
                    if (volumeSlider.muteButton.classList.contains("muted")) {
                        window.CommandService.setMixMute(false, device, window.DataService.panel.preset);
                    } else {
                        window.CommandService.setMixMute(true, device, window.DataService.panel.preset);
                    }
                }
            });
            this.sliders.push(volumeSlider);
            if (device.muted) {
                volumeSlider.muteButton.classList.add("muted");
                volumeSlider.muteButton.textContent = "Unmute";
            }
        }
    },

    populateMicrophoneVolumes: function () {
        const microphonesTab = document.querySelector('.microphones-tab');
        const microphonesAudioControls = document.querySelector('.microphones-audio-controls');

        if (window.DataService.panel.preset.independentAudioDevices.length === 0) {
            microphonesTab.classList.add('hidden');
            microphonesAudioControls.classList.add('hidden');
            console.warn("No independent audio devices found in the preset.");
            return;
        }

        const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);

        for (const microphone of window.DataService.panel.preset.independentAudioDevices) {
            const volumeSlider = new VolumeSliderClass(microphonesAudioControls, {
                title: microphone.displayname,
                value: microphone.volume,
                icon: `./assets/${microphone.icon}.svg` || null,
                onChange: (val) => {
                    console.log(`Volume for ${microphone.displayname} changed to:`, val);
                    window.CommandService.setVolume(val, [microphone]);
                    window.CommandService.setMixMute(false, microphone, window.DataService.panel.preset);
                },
                muteFunction: () => {
                    if (volumeSlider.muteButton.classList.contains("muted")) {
                        window.CommandService.setMixMute(false, microphone, window.DataService.panel.preset);
                    } else {
                        window.CommandService.setMixMute(true, microphone, window.DataService.panel.preset);
                    }
                }
            });

            this.sliders.push(volumeSlider);
            if (microphone.muted) {
                volumeSlider.muteButton.classList.add("muted");
                volumeSlider.muteButton.textContent = "Unmute";
            }
        }

    },

    populateAudioGroupings: function () {
        if (!window.DataService.panel.preset.audioGroups || window.DataService.panel.preset.audioGroups.length === 0) {
            console.warn("No audio groups found in the preset.");
            return;
        }

        const audioGroups = window.DataService.panel.preset.audioGroups;
        console.log("Audio Groups:", audioGroups);

        for (const [groupName, groupDevices] of Object.entries(audioGroups)) {
            // create the tab button
            const audioTabsContainer = document.querySelector('.audio-tabs-container');
            const tabButton = document.createElement('div');
            tabButton.className = `${groupName.toLowerCase()}-tab audio-tab`;
            tabButton.textContent = groupName;
            audioTabsContainer.appendChild(tabButton);

            // Build the HTML for the content section
            let html = `
                <div class="arrow left-arrow hidden" style="display:none;">
                    <img class="carousel-arrow outputs-carousel-arrow-left" src="assets/arrow_left.svg" alt="Previous">
                </div>
                <div class="${groupName.toLowerCase()}-audio-controls audio-controls-content paginated-container"></div>
                <div class="arrow right-arrow hidden" style="display:none;">
                    <img class="carousel-arrow outputs-carousel-arrow-right" src="assets/arrow_right.svg" alt="Next">
                </div>
            `;
            const contentContainer = document.querySelector('.audio-controls');
            const contentSection = document.createElement('div');
            contentSection.className = `${groupName.toLowerCase()}-audio-controls-wrapper audio-controls-content-wrapper hidden`;
            contentSection.innerHTML = html;
            contentContainer.appendChild(contentSection);

            // Add volume sliders for each device in groupDevices to controlsDiv
            const controlsDiv = contentSection.querySelector(`.${groupName.toLowerCase()}-audio-controls`);
            const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);
            for (const device of groupDevices) {
                const audioDevices = window.DataService.panel.preset.audioDevices;
                const independentAudioDevices = window.DataService.panel.preset.independentAudioDevices;
                const audioDevice = audioDevices.find(d => d.name === device) || independentAudioDevices.find(d => d.name === device);
                if (audioDevice) {
                    const volumeSlider = new VolumeSliderClass(controlsDiv, {
                        title: audioDevice.displayname || audioDevice.name || audioDevice,
                        value: audioDevice.mixlevel || audioDevice.volume || 30,
                        icon: audioDevice.icon ? `./assets/${audioDevice.icon}.svg` : null,
                        onChange: (val) => {
                            console.log(`Volume for ${audioDevice.displayname || audioDevice.name || audioDevice} changed to:`, val);
                            window.CommandService.setMixLevel(val, audioDevice, window.DataService.panel.preset);
                            window.CommandService.setMixMute(false, audioDevice, window.DataService.panel.preset);
                        },
                        muteFunction: function () {
                            if (volumeSlider.muteButton.classList.contains("muted")) {
                                window.CommandService.setMixMute(false, audioDevice, window.DataService.panel.preset);
                            } else {
                                window.CommandService.setMixMute(true, audioDevice, window.DataService.panel.preset);
                            }
                        },
                        id: audioDevice.name || audioDevice.displayname || audioDevice
                    });
                    window.components.audioControl.sliders.push(volumeSlider);
                    if (audioDevice.muted) {
                        volumeSlider.muteButton.classList.add("muted");
                        volumeSlider.muteButton.textContent = "Unmute";
                    }
                }
            }
        }
    },


    // Removed toggleDisplaysMicrophones: now handled by generic tab logic

    paginationState: {
        displays: 0,
        microphones: 0
    },

    initPagination: function () {
        ['displays', 'microphones'].forEach(type => {
            const wrapper = document.querySelector(`.${type}-audio-controls-wrapper`);
            const container = wrapper.querySelector(`.${type}-audio-controls`);
            const leftArrow = wrapper.querySelector('.left-arrow');
            const rightArrow = wrapper.querySelector('.right-arrow');

            const updatePagination = () => {
                const children = Array.from(container.children);
                const total = children.length;
                const pageSize = 4;
                const pageIndex = this.paginationState[type];

                // Hide or show arrows
                leftArrow.classList.toggle('hidden', pageIndex === 0);
                rightArrow.classList.toggle('hidden', (pageIndex + 1) * pageSize >= total);

                // Show only current page items
                children.forEach((child, i) => {
                    const start = pageIndex * pageSize;
                    const end = start + pageSize;
                    child.style.display = (i >= start && i < end) ? 'flex' : 'none';
                });
            };

            leftArrow.addEventListener('click', () => {
                window.CommandService.buttonPress(`clicked left arrow on ${type} audio controls`, {});
                if (this.paginationState[type] > 0) {
                    this.paginationState[type]--;
                    updatePagination();
                    this.resetVolumeSliderHeights();
                }
            });

            rightArrow.addEventListener('click', () => {
                window.CommandService.buttonPress(`clicked right arrow on ${type} audio controls`, {});
                const total = container.children.length;
                const maxPage = Math.floor((total - 1) / 4);
                if (this.paginationState[type] < maxPage) {
                    this.paginationState[type]++;
                    updatePagination();
                    this.resetVolumeSliderHeights();
                }
            });

            // Initial visibility check
            setTimeout(updatePagination, 100);
        });
    },

    // volume sliders' appearance calculations need to be reset when switching tabs
    resetVolumeSliderHeights: function () {
        this.sliders.forEach(slider => {
            slider.setSliderWidth()
            slider.updateLabelPosition()
        });
    }
};