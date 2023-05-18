import '../plugins/tailwind';

const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor');

module.exports = on => {
  on('file:preprocessor', cypressTypeScriptPreprocessor);
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.name.startsWith('chrom')) {
      launchOptions.args.push('--window-size=900,960');
    }
    return launchOptions;
  });
};
