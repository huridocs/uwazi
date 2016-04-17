/* eslint-disable */

var webpack = require('webpack');
var path = require('path');
var webpackConfig = require('./webpack.config.js');

webpackConfig.externals = {
  'jsdom': 'window',
  'cheerio': 'window',
  'react/lib/ExecutionEnvironment': true,
  'react/lib/ReactContext': true
}
webpackConfig.devtool = 'inline-source-map';
delete webpackConfig.entry;
delete webpackConfig.output;

karmaConfig = {
  browsers: ['PhantomJS'],
  singleRun: false,
  frameworks: ['jasmine'],
  files: [
    './node_modules/phantomjs-polyfill-find/find-polyfill.js',
    './node_modules/phantomjs-polyfill-object-assign/object-assign-polyfill.js',
    'tests.webpack.js'
  ],
  plugins: [
    'karma-firefox-launcher',
    'karma-chrome-launcher',
    'karma-phantomjs-launcher',
    'karma-jasmine',
    'karma-sourcemap-loader',
    'karma-webpack',
    'karma-coverage'
  ],
  browserNoActivityTimeout: 100000,
  preprocessors: {
    'tests.webpack.js': [ 'webpack', 'sourcemap' ]
  },
  reporters: [ 'dots' ],
  webpack: webpackConfig,
  webpackServer: {
    noInfo: true
  }
}

module.exports = function (config) {
  if (config.ci) {
    karmaConfig.browsers = ['Firefox', 'Chrome', 'PhantomJS'];
    karmaConfig.singleRun = true;
    karmaConfig.reporters.push('coverage');
    karmaConfig.webpack.module.preLoaders = [{
      test: /\.js$/,
      include: [path.join(__dirname)],
      loader: 'babel-istanbul',
      exclude: /node_modules|specs/
    }];
    karmaConfig.coverageReporter = {
      type: 'lcov',
      dir: 'coverage/',
      subdir: function(browser) {
        return browser.toLowerCase().split(/[ /-]/)[0];
      }
    };
  }
  config.set(karmaConfig)
};
