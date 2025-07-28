window.components = window.components || {};

window.components.audioControl = {
    sliders: [],

    loadPage: function () {

        this.populateMasterVolume();
        this.populateDisplayVolumes();
        this.populateMicrophoneVolumes();

        // tab listeners
        document.querySelector('.displays-tab').addEventListener('click', () => {
            if (!(document.querySelector('.displays-tab').classList.contains('active-audio-tab'))) {
                this.toggleDisplaysMicrophones();
            }

        });

        document.querySelector('.microphones-tab').addEventListener('click', () => {
            if (!document.querySelector('.microphones-tab').classList.contains('active-audio-tab')) {
                this.toggleDisplaysMicrophones();
            }
        });



    },

    cleanup: function () {
        // Cleanup logic if needed
    },

    populateMasterVolume: function () {
        const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);

        const MasterVolume = new VolumeSliderClass(document.querySelector('.master-volume-container'), {
            title: "Master Display Volume",
            value: 30,
            onChange: (val) => {
                console.log("Master volume changed to:", val);
                window.CommandService.setMasterVolume(val, window.DataService.panel.preset);
            },
            muteFunction: () => {
                if (MasterVolume.muteButton.classList.contains("muted")) {
                    window.CommandService.setMasterMute(true, window.DataService.panel.preset);
                } else {
                    window.CommandService.setMasterMute(false, window.DataService.panel.preset);
                }
            }
        });

        this.sliders.push(MasterVolume);
    },

    populateDisplayVolumes: function () {
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
            console.log("Adding volume slider for display device:", device);
            const volumeSlider = new VolumeSliderClass(document.querySelector('.displays-audio-controls'), {
                title: device.displayname,
                value: 30,
                icon: `./assets/${device.icon}.svg` || null,
                onChange: (val) => {
                    console.log(`Volume for ${device.displayname} changed to:`, val);
                    window.CommandService.setMixLevel(val, device, window.DataService.panel.preset);
                    window.CommandService.setMixMute(false, device, window.DataService.panel.preset);
                },
                muteFunction: () => {
                    if (volumeSlider.muteButton.classList.contains("muted")) {
                        window.CommandService.setMixMute(true, device, window.DataService.panel.preset);
                    } else {
                        window.CommandService.setMixMute(false, device, window.DataService.panel.preset);
                    }
                }
            });

            this.sliders.push(volumeSlider);
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

        for (const device of window.DataService.panel.preset.independentAudioDevices) {
            console.log("Adding volume slider for microphone:", device);
            const volumeSlider = new VolumeSliderClass(microphonesAudioControls, {
                title: device.displayname,
                value: 30,
                icon: `./assets/${device.icon}.svg` || null,
                onChange: (val) => {
                    console.log(`Volume for ${device.displayname} changed to:`, val);
                    window.CommandService.setMixLevel(val, device, window.DataService.panel.preset);
                    window.CommandService.setMixMute(false, device, window.DataService.panel.preset);
                },
                muteFunction: () => {
                    if (volumeSlider.muteButton.classList.contains("muted")) {
                        window.CommandService.setMixMute(true, device, window.DataService.panel.preset);
                    } else {
                        window.CommandService.setMixMute(false, device, window.DataService.panel.preset);
                    }
                }
            });

            this.sliders.push(volumeSlider);
        }

    },

    // navigates the audio control component between displays and microphones
    toggleDisplaysMicrophones: function () {
        const displaysTab = document.querySelector('.displays-tab');
        const microphonesTab = document.querySelector('.microphones-tab');
        if (displaysTab && microphonesTab) {
            displaysTab.classList.toggle('active-audio-tab');
            microphonesTab.classList.toggle('active-audio-tab');
        }

        if (document.querySelector('.microphones-audio-controls').classList.contains('hidden')) {
            document.querySelector('.microphones-audio-controls').classList.remove('hidden');
            document.querySelector('.displays-audio-controls').classList.add('hidden');
            this.resetVolumeSliderHeights();
        } else {
            document.querySelector('.displays-audio-controls').classList.remove('hidden');
            document.querySelector('.microphones-audio-controls').classList.add('hidden');
            this.resetVolumeSliderHeights();
        }
    },

    // volume sliders' appearance calculations need to be reset when switching tabs
    resetVolumeSliderHeights: function () {
        this.sliders.forEach(slider => {
            slider.setSliderWidth();
            slider.updateLabelPosition();
        });
    }
};