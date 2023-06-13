import '../plugins/tailwind';

const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor');

module.exports = (on, config) => {
  require('@cypress/code-coverage/task')(on, config);
  on('file:preprocessor', cypressTypeScriptPreprocessor);

  return config;
};
