import { defineConfig } from 'cypress';
const { initPlugin } = require('cypress-plugin-snapshots/plugin');

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 768,
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      initPlugin(on, config);
      require('./cypress/plugins/index.js')(on, config);
      return config;
    },
    baseUrl: 'http://localhost:3000',
    video: false,
    testIsolation: false,
  },
  component: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      require('./cypress/plugins/index.js')(on, config);
      return config;
    },
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'app/react/**/*.cy.tsx',
  },
});
