window.components = window.components || {};

window.components.display = {
  loadPage: function () {
    const VolumeSliderClass = window.VolumeSlider || (window.components && window.components.VolumeSlider);
    
    const MasterVolume = new VolumeSliderClass(document.querySelector('.volume-container'), {
      title: "Master Display Volume 2",
      value: 37
    });

  },

  cleanup: function () {
    // Cleanup logic if needed
  },
};