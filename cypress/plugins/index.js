const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor');
const webpackPreprocessor = require('@cypress/webpack-preprocessor')

module.exports = (on, config) => {
  // eslint-disable-next-line global-require
  require('@cypress/code-coverage/task')(on, config);
  //on('file:preprocessor', cypressTypeScriptPreprocessor);
  //on('file:preprocessor', require('@cypress/code-coverage/use-babelrc'));
  const options = {
    // send in the options from your webpack.config.js, so it works the same
    // as your app's code
    webpackOptions: require('../../webpack.config'),
    watchOptions: {},
  }

  on('file:preprocessor', webpackPreprocessor(options))
  return config;
};
