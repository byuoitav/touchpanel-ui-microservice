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
      // Click the display tab
      cy.get(DisplayTab).click();
    
      shouldBeVisible(DisplayControl);
      cy.get(AudioCameraControl).should('not.exist');
    })

    it('should navigate from Camera Control', () => {    
      cy.visit('/')

      // Click the camera tab
      cy.get(CameraTab).click();
      // Click the display tab
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
      // the display body
      shouldBeHidden(DisplayControl);
    })

    it('should navigate from Camera Control', () => {    
      cy.visit('/')

      // Click the camera tab
      cy.get(CameraTab).click();
      // Click the audio tab
      cy.get(AudioTab).click();
    
      shouldBeVisible(AudioCameraControl);
      // the display body
      shouldBeHidden(DisplayControl);
    })
  });

  describe('Navigation to Camera Control', () => {
    it('should navigate from Display', () => {
      cy.visit('/')
      // Click the camera tab
      cy.get(CameraTab).click();

      shouldBeVisible(AudioCameraControl);
      // the display body
      shouldBeHidden(DisplayControl);
    });

    it('should navigate from Audio Control', () => {
      cy.visit('/')
      // Click the audio tab
      cy.get(AudioTab).click();
      // Click the camera tab
      cy.get(CameraTab).click();

      shouldBeVisible(AudioCameraControl);
      // the display body
      shouldBeHidden(DisplayControl);
    });
  });

  describe('Display Control', () => {
    it('should open the help dialog', () => {
      cy.visit('/')
      cy.get(HelpDialog).should('not.exist');

      // Click the help button
      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');
    });

    it('should close the help dialog', () => {
      cy.visit('/')
      cy.get(HelpDialog).should('not.exist');

      // Click the help button
      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');

      // Click the close button
      cy.get('#cancelButton').click();
      cy.get(HelpDialog).should('not.exist');
    });
  });

  describe('Audio Control', () => {
    it('should open the help dialog', () => {
      cy.visit('/')
      // Click the audio tab
      cy.get(AudioTab).click();

      cy.get(HelpDialog).should('not.exist');

      // Click the help button
      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');
    });

    it('should close the help dialog', () => {
      cy.visit('/')
      // Click the audio tab
      cy.get(AudioTab).click();

      cy.get(HelpDialog).should('not.exist');

      // Click the help button
      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');

      // Click the close button
      cy.get('#cancelButton').click();
      cy.get(HelpDialog).should('not.exist');
    });
  });

  describe('Camera Control', () => {
    it('should open the help dialog', () => {
      cy.visit('/')
      // Click the camera tab
      cy.get(CameraTab).click();

      cy.get(HelpDialog).should('not.exist');

      // Click the help button
      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');
    });

    it('should close the help dialog', () => {
      cy.visit('/')
      // Click the camera tab
      cy.get(CameraTab).click();

      cy.get(HelpDialog).should('not.exist');

      // Click the help button
      cy.get(HelpButton).click();
      cy.get(HelpDialog).should('be.visible');

      // Click the close button
      cy.get('#cancelButton').click();
      cy.get(HelpDialog).should('not.exist');
    });
  });


})

describe('Display', () => {
  it('should load the display page', () => {
    cy.visit('/')
    cy.get('#mat-tab-label-0-0').click();
    cy.get('#mat-tab-content-0-0').should('be.visible');
  })
});
