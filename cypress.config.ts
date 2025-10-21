import fs from 'fs';
import { defineConfig } from 'cypress';
import webpackConfig from './webpack.config';
import cypressFailFast from 'cypress-fail-fast/plugin';

const cypressWebpackConfig = {
  ...webpackConfig,
  cache: false, // disable cache for Cypress component testing
  optimization: {
    ...webpackConfig.optimization,
    minimize: false, // disable minification for Cypress (keeps debugging easier)
    moduleIds: 'named', // CRITICAL FIX: use named module IDs instead of deterministic for cypress-axe
    chunkIds: 'named', // CRITICAL FIX: use named chunk IDs instead of deterministic for cypress-axe
    // Keep other optimizations like splitChunks for better performance
  },
  module: {
    ...webpackConfig.module,
    rules: webpackConfig.module.rules.map(rule => {
      // Remove thread-loader from Cypress builds (can cause module resolution issues)
      if (rule.use && Array.isArray(rule.use)) {
        return {
          ...rule,
          use: rule.use.filter(loader => {
            if (typeof loader === 'object' && loader.loader === 'thread-loader') {
              return false;
            }
            return true;
          }),
        };
      }
      return rule;
    }),
  },
  resolve: {
    ...webpackConfig.resolve,
    // Ensure cypress-axe can resolve its files properly
    fallback: {
      ...webpackConfig.resolve.fallback,
      fs: false, // disable fs fallback for cypress-axe
      path: false, // disable path fallback for cypress-axe
    },
  },
};

const { initPlugin } = require('cypress-plugin-snapshots/plugin');

const retries = process.env.CYPRESS_RETRIES ? parseInt(process.env.CYPRESS_RETRIES, 10) : 0;

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 768,
  defaultCommandTimeout: 12000,
  requestTimeout: 30000,
  env: {
    FAIL_FAST_ENABLED: process.env.CYPRESS_FAIL_FAST_ENABLED || 'false',
    FAIL_FAST_STRATEGY: process.env.CYPRESS_FAIL_FAST_STRATEGY || 'run',
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: true,
    retries,
    screenshotOnRunFailure: false,
    testIsolation: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      initPlugin(on, config);
      cypressFailFast(on, config);

      // Add logging tasks for accessibility violations
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
      });

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
        if (browser.name === 'chrome' || browser.name === 'chromium' || browser.name === 'edge') {
          // Ensure consistent viewport and stable CI runs for Chromium-family browsers in both headed and headless modes
          launchOptions.args.push('--window-size=1280,768');
          launchOptions.args.push('--force-device-scale-factor=1');
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
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
      webpackConfig: cypressWebpackConfig,
    },
    specPattern: 'app/react/**/*.cy.tsx',
    setupNodeEvents(on, config) {
      initPlugin(on, config);
    },
  },
});
