import { defineConfig } from 'cypress';
// const { initPlugin } = require('cypress-plugin-snapshots/plugin');
const getCompareSnapshotsPlugin = require('cypress-visual-regression/dist/plugin');

export default defineConfig({
  viewportWidth: 1366,
  viewportHeight: 768,
  env: {
    type: 'actual', // If you want to update cypress e2e snapshots, change this to "base"
  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // initPlugin(on, config);
      getCompareSnapshotsPlugin(on, config);
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
});
