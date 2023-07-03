import { defineConfig } from 'cypress';
const { initPlugin } = require('cypress-plugin-snapshots/plugin');
const a = require('@cypress/code-coverage/use-babelrc');

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 768,
  e2e: {
    setupNodeEvents(on, config) {
      initPlugin(on, config);
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
    baseUrl: 'http://localhost:3000',
    env: {
      codeCoverage: {
        url: 'http://localhost:3000/__coverage__',
        expectBackendCoverageOnly: true,
      },
    },
    video: false,
    testIsolation: false,
  },
  component: {
    setupNodeEvents(on, config) {
      process.env.BABEL_ENV = 'debug';
      require('@cypress/code-coverage/task')(on, config);
      on('file:preprocessor', require('@cypress/code-coverage/use-babelrc'));

      return config;
    },
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'app/react/**/*.cy.tsx',
  },
});
