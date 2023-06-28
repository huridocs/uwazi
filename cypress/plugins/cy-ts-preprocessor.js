const wp = require('@cypress/webpack-preprocessor');

const webpackOptions = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$|\.tsx/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader?cacheDirectory',
            options: {
              sourceMap: true,
            },
            plugins: ['istanbul'],
          },
        ],
      },
    ],
  },
};

const options = {
  webpackOptions,
};

module.exports = wp(options);
