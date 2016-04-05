var webpack = require('webpack');
var path = require('path');

module.exports = function (config) {
  config.set({
    browsers: ['PhantomJS' ], // Chrome, PhantomJS
    singleRun: false, //just run once by default
    frameworks: [ 'jasmine' ], //use the mocha test framework
    files: [
      './node_modules/phantomjs-polyfill-find/find-polyfill.js',
      'tests.webpack.js' //just load this file
    ],
    plugins: [
      'karma-phantomjs-launcher',
      'karma-jasmine',
      'karma-sourcemap-loader',
      'karma-webpack',
      'karma-coverage'
    ],
    browserNoActivityTimeout: 1000000,
    preprocessors: {
      'tests.webpack.js': [ 'webpack', 'sourcemap' ] //preprocess with webpack and our sourcemap loader
    },
    reporters: [ 'dots', 'coverage' ], //report results in this format
    webpack: { //kind of a copy of your webpack config
      devtool: 'eval', //just do inline source maps instead of the default
      module: {
        loaders: [
          {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /(node_modules)/,
            query: {
              plugins: [
                ['babel-plugin-module-alias', [
                  { 'src': './app/react', 'expose': 'app' }
                ]],
                'transform-class-properties',
                'add-module-exports'
              ]
            }
          },
          {
            test: /\.scss$/,
            loaders: ['style', 'css?sourceMap', 'sass?sourceMap'],
            include: [path.join(__dirname, 'app'),path.join(__dirname, 'node_modules')]
          },
          {
            test: /\.css$/,
            loader: "style-loader!css-loader",
            include: [path.join(__dirname, 'app'), path.join(__dirname, 'node_modules')]
          },
          {
            test: /\.(jpe?g|png|eot|woff|woff2|ttf|gif|svg)(\?.*)?$/i,
            loader: 'file-loader',
            include: [path.join(__dirname, 'app'), path.join(__dirname, 'node_modules')]
          }
        ],
        postLoaders: [ { //delays coverage til after tests are run, fixing transpiled source coverage error
            test: /\.js$/,
            exclude: /(spec|node_modules|bower_components)\//,
            loader: 'istanbul-instrumenter' } ]
      },
      externals: {
        'jsdom': 'window',
        'cheerio': 'window',
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': true
      }
    },
    webpackServer: {
      noInfo: true //please don't spam the console when running in karma!
    },
    coverageReporter: {
      type: 'html', //produces a html document after code is run
      dir: 'coverage/' //path to created html doc
    }
  });
};
