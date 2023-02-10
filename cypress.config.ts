import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1024,
  viewportHeight: 660,
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
