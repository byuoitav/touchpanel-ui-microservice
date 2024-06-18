import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('Loading and Navigation', () => {
  const DisplayTab = '#mat-tab-label-0-0'
  const DisplayControl = "#mat-tab-content-0-0"
  const AudioTab = '#mat-tab-label-0-1'
  const AudioCameraControl = "#mat-tab-content-1-0"
  const CameraTab = '#mat-tab-label-0-2'
  const HelpDialog = ".mdc-dialog"
  const HelpButton = ".help"

  const shouldBeHidden = (object) => {
    return cy.get(object).should('have.attr', 'aria-hidden', 'true');
  }

  const shouldBeVisible = (object) => {
    return cy.get(object).should('have.attr', 'aria-hidden', 'false');
  }

  it('should load to the initial display page', () => {
    cy.visit('/')
    // the main display body
    cy.get(DisplayControl).should('be.visible');
    // power button visible
    cy.get('.power > .mat-mdc-button-touch-target').should('be.visible');
    // help button visible
    cy.get(HelpButton).should('be.visible');  
  })

  describe('Navigation to Display Control', () => {
    it('should navigate from Audio Control', () => {    
      cy.visit('/')

      // Click the audio tab
      cy.get(AudioTab).click();
      cy.get(DisplayTab).click();
    
      shouldBeVisible(DisplayControl);
      cy.get(AudioCameraControl).should('not.exist');
    })

    it('should navigate from Camera Control', () => {    
      cy.visit('/')

      cy.get(CameraTab).click();
      cy.get(DisplayTab).click();
    
      shouldBeVisible(DisplayControl);
      cy.get(AudioCameraControl).should('not.exist');
    })
  });

  describe('Navigation to Audio Control', () => {
    it('should navigate from Display', () => {    
      cy.visit('/')

      // Click the audio tab
      cy.get(AudioTab).click();
    
      shouldBeVisible(AudioCameraControl);
      shouldBeHidden(DisplayControl);
    })

    it('should navigate from Camera Control', () => {    
      cy.visit('/')

      cy.get(CameraTab).click();
      // Click the audio tab
      cy.get(AudioTab).click();
    
      shouldBeVisible(AudioCameraControl);
      shouldBeHidden(DisplayControl);
    })
  });

  describe('Navigation to Camera Control', () => {
    it('should navigate from Display', () => {
      cy.visit('/')
      cy.get(CameraTab).click();

      shouldBeVisible(AudioCameraControl);
      shouldBeHidden(DisplayControl);
    });

    it('should navigate from Audio Control', () => {
      cy.visit('/')
      // Click the audio tab
      cy.get(AudioTab).click();
      cy.get(CameraTab).click();

      shouldBeVisible(AudioCameraControl);
      shouldBeHidden(DisplayControl);
    });
  });

  describe('Display Control', () => {
    const VolumeSlider = '.ngx-slider-full-bar';
    const VolumeValue = '.ngx-slider-model-value';

    it('should load the display page', () => {
      cy.visit('/');
      cy.get('#mat-tab-label-0-0').click();
      cy.get('#mat-tab-content-0-0').should('be.visible');
    })
  
    it('should change audio to 100%', () => {
      cy.visit('/your-page-url');
      cy.get(VolumeSlider).click('top');
      cy.get(VolumeValue).should('contain', '100');``
    });
  
    it('should change audio to 0%', () => {
      cy.visit('/your-page-url');
      cy.get(VolumeSlider).click('bottomLeft', { force: true });
      cy.get(VolumeValue).should('contain', '0');``
    });
  
    it('should change audio to 50%', () => {
      cy.visit('/your-page-url');
      cy.get(VolumeSlider).click('center', { force: true });
      cy.get(VolumeValue).should('contain', '0');``
    });
  
    it('should click mute, become unmute', () => {
      cy.visit('/your-page-url');
      cy.get('#mute').click();
      cy.get('#mute').should('contain', 'Unmute');
    });
    it('should click unmute, become mute', () => {
      cy.visit('/your-page-url');
      cy.get('#mute').click();
      cy.get('#mute').click();
      cy.get('#mute').should('contain', 'Mute');
    });

    it('should open the help dialog', () => {
      cy.visit('/')
      cy.get(HelpDialog).should('not.exist');

      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');
    });

    it('should close the help dialog', () => {
      cy.visit('/')
      cy.get(HelpDialog).should('not.exist');

      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');

      cy.get('#cancelButton').click();
      cy.get(HelpDialog).should('not.exist');
    });
  });

  describe('Audio Control', () => {
    const VolumeSlider = '.ngx-slider-full-bar';
    const VolumeValue = '.ngx-slider-model-value';
    const AudioTab = '#mat-tab-label-0-1';
  
    it('should change volume sliders to 100%', () => {
      cy.visit('/your-page-url');
      cy.get(AudioTab).click();
      cy.get(VolumeSlider).click('top', { multiple: true, force: true});
      cy.get(VolumeValue).should('contain', '100');``
    });
  
    it('should change volume sliders to 50%', () => {
      cy.visit('/your-page-url');
      cy.get(AudioTab).click();
      cy.get(VolumeSlider).click('center', { multiple: true, force: true});
      cy.get(VolumeValue).should('contain', '50');``
    });
  
    it('should change volume sliders to 0%', () => {
      cy.visit('/your-page-url');
      cy.get(AudioTab).click();
      cy.get(VolumeSlider).click('bottom', { multiple: true, force: true});
      cy.get(VolumeValue).should('contain', '0');``
    });

    it('should click mute, become unmute', () => {
      cy.visit('/your-page-url');
      cy.get(AudioTab).click({force: true, multiple: true});
      cy.get('#mute').click({force: true, multiple: true});
      cy.get('#mute').should('contain', 'Unmute');
    });

    it('should click unmute, become mute', () => {
      cy.visit('/your-page-url');
      cy.get(AudioTab).click();
      cy.get('#mute').click({force: true, multiple: true});
      cy.get('#mute').click({force: true, multiple: true});
      cy.get('#mute').should('contain', 'Mute');
    });

    it('should open the help dialog', () => {
      cy.visit('/')
      // Click the audio tab
      cy.get(AudioTab).click();

      cy.get(HelpDialog).should('not.exist');

      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');
    });

    it('should close the help dialog', () => {
      cy.visit('/')
      // Click the audio tab
      cy.get(AudioTab).click();

      cy.get(HelpDialog).should('not.exist');

      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');

      cy.get('#cancelButton').click();
      cy.get(HelpDialog).should('not.exist');
    });
  });

  describe('Camera Control', () => {
    it('should open the help dialog', () => {
      cy.visit('/')
      cy.get(CameraTab).click();

      cy.get(HelpDialog).should('not.exist');

      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');
    });

    it('should close the help dialog', () => {
      cy.visit('/')
      cy.get(CameraTab).click();

      cy.get(HelpDialog).should('not.exist');

      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');

      cy.get('#cancelButton').click();
      cy.get(HelpDialog).should('not.exist');
    });
  });
})

describe('API TESTS', () => { 
  describe('Theme API', () => {
    const mock = new MockAdapter(axios);
    const themeConfig = require(`../fixtures/themeMock.json`);
    
    it('should get the theme', () => {
      //intercept the get request to the theme endpoint
      mock.onGet('/themeconfig').reply(404, themeConfig);
      cy.visit('/');
    });
  });
});

