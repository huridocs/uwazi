import fs from 'fs';
import { defineConfig } from 'cypress';

const { initPlugin } = require('cypress-plugin-snapshots/plugin');

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 768,
  defaultCommandTimeout: 12000,
  requestTimeout: 30000,
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: true,
    retries: 1,
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
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--window-size=1280,768');
          launchOptions.args.push('--force-device-scale-factor=1');
        }

        if (browser.name === 'electron' && browser.isHeadless) {
          launchOptions.preferences.width = 1280;
          launchOptions.preferences.height = 768;
        }

        if (browser.name === 'firefox' && browser.isHeadless) {
          launchOptions.args.push('--width=1280');
          launchOptions.args.push('--height=768');
        }

        return launchOptions;
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
