const fs = require('fs');
const path = require('path');
const { defineConfig } = require('cypress');
const cypressFailFast = require('cypress-fail-fast/plugin');
const webpackPreprocessor = require('@cypress/webpack-preprocessor');
const configFactory = require('./webpack/config.cjs');
const { addMatchImageSnapshotPlugin } = require('@simonsmith/cypress-image-snapshot/plugin');
const webpackConfig = configFactory(false);

const cypressWebpackConfig = {
  ...webpackConfig,
  cache: false,
  optimization: {
    ...webpackConfig.optimization,
    minimize: false,
    moduleIds: 'named',addMatchImageSnapshotPlugin
    chunkIds: 'named',
  },
  module: {
    ...webpackConfig.module,
    rules: webpackConfig.module.rules.map(rule => {
      if (rule.use && Array.isArray(rule.use)) {
        const newRule = {
          ...rule,
          use: rule.use.filter(loader => {
            if (typeof loader === 'object' && loader.loader === 'thread-loader') {
              return false;
            }
            return true;
          }),
        };
        if (rule.test && rule.test.toString().includes('ts')) {
          newRule.include = [rule.include, path.join(__dirname, 'cypress')].filter(Boolean);
        }
        return newRule;
      }
      return rule;
    }),
  },
  resolve: {
    ...webpackConfig.resolve,
    fallback: {
      ...webpackConfig.resolve.fallback,
      fs: false,
    },
  },
};

const retries = process.env.CYPRESS_RETRIES ? parseInt(process.env.CYPRESS_RETRIES, 10) : 0;

module.exports = defineConfig({
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
      addMatchImageSnapshotPlugin(on);
      cypressFailFast(on, config);
      on('file:preprocessor', webpackPreprocessor({ webpackOptions: cypressWebpackConfig }));

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

      on('after:spec', (spec, results) => {
        if (results && results.video) {
          const failures = results.tests.some(test =>
            test.attempts.some(attempt => attempt.state === 'failed')
          );
          if (!failures) {
            fs.unlinkSync(results.video);
          }
        }
      });

      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' || browser.name === 'chromium' || browser.name === 'edge') {
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
    setupNodeEvents(on) {
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
    },
  },
});
