module.exports = (on, config) => {
  if (config.testingType === 'component') {
    const { startDevServer } = require('@cypress/webpack-dev-server');

    // path to your webpack.cypress config
    const webpackConfig = require('../webpack.cypress.config');

    on('dev-server:start', options => startDevServer({ options, webpackConfig }));
  }
};
