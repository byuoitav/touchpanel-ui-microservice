import { defineConfig } from 'cypress'

export default defineConfig({
  
  e2e: {
    'baseUrl': 'http://localhost:4200',
    'specPattern': 'e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    'supportFile': 'e2e/cypress/support/e2e.ts',
  },
  
  
  
})