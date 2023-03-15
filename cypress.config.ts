import { defineConfig } from 'cypress';
const { addCompareScreenshotPlugin } = require('cypress-odiff');

export default defineConfig({
  viewportWidth: 1366,
  viewportHeight: 768,
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // const getCompareSnapshotsPlugin = require('cypress-image-diff-js/dist/plugin');
      // getCompareSnapshotsPlugin(on, config);
      addCompareScreenshotPlugin(on, config);
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
});
