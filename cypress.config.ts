import fs from 'fs';
import { defineConfig } from 'cypress';

const { initPlugin } = require('cypress-plugin-snapshots/plugin');

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 600,
  defaultCommandTimeout: 10000,
  requestTimeout: 12000,
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: true,
    screenshotOnRunFailure: false,
    testIsolation: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      // implement node event listeners here
      initPlugin(on, config);
      on('after:spec', (spec: Cypress.Spec, results: CypressCommandLine.RunResult) => {
        if (results && results.video) {
          // Do we have failures for any retry attempts?
          const failures = results.tests.some(test =>
            test.attempts.some(attempt => attempt.state === 'failed')
          );
          if (!failures) {
            // delete the video if the spec passed and no tests retried
            fs.unlinkSync(results.video);
          }
        }
      });
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'app/react/**/*.cy.tsx',
  },
});
