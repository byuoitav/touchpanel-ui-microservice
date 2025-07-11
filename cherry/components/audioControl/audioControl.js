window.components = window.components || {};

window.components.audioControl = {
    loadPage: function () {
        const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);

        const MasterVolume = new VolumeSliderClass(document.querySelector('.master-volume-container'), {
            title: "Master Display Volume",
            value: 30
        });

        const ProjectorVolume = new VolumeSliderClass(document.querySelector('.audio-controls'), {
            title: "Projector",
            value: 100
        });

        const TVVolume = new VolumeSliderClass(document.querySelector('.audio-controls'), {
            title: "TV",
            value: 50
        });

        const SpeakerVolume = new VolumeSliderClass(document.querySelector('.audio-controls'), {
            title: "Speakers",
            value: 75
        });

        const MicVolume = new VolumeSliderClass(document.querySelector('.audio-controls'), {
            title: "Microphone",
            value: 80
        });

        const CameraVolume = new VolumeSliderClass(document.querySelector('.audio-controls'), {
            title: "Camera",
            value: 60
        });

        const ComputerVolume = new VolumeSliderClass(document.querySelector('.audio-controls'), {
            title: "Computer",
            value: 90
        });

    },

    cleanup: function () {
        // Cleanup logic if needed
    },
};