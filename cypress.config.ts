import { defineConfig } from 'cypress';
import { initPlugin } from '@frsource/cypress-plugin-visual-regression-diff/plugins';

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 768,
  e2e: {
    setupNodeEvents(on, config) {
      initPlugin(on, config);
    },
    baseUrl: 'http://localhost:3000',
    video: false,
    testIsolation: false,
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'app/react/**/*.cy.tsx',
  },
});
