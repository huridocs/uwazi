/* eslint-disable */
'use strict';

var path = require('path');
var webpack = require('webpack');
var del = require('del');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

class CleanPlugin {
  constructor(options) {
    this.options = options;
  }

  apply () {
    del.sync(this.options.files);
  }
}

module.exports = {
  context: __dirname,
  devtool: '#source-map',
  entry: {
    main: path.join(__dirname, 'app/react/index.js'),
    'pdf.worker': path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.entry'),
  },
  output: {
    path: path.join(__dirname, '/dist/'),
    publicPath: '/',
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader?cacheDirectory',
        include: path.join(__dirname, 'app'),
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap!sass-loader?outputStyle=expanded&sourceMap=true&sourceMapContents=true'
        }),
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'node_modules/react-widgets/lib/scss/')
        ]
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap'
        }),
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'node_modules/react-datepicker/dist/'),
          path.join(__dirname, 'node_modules/bootstrap/dist/'),
          path.join(__dirname, 'node_modules/font-awesome/css/'),
          path.join(__dirname, 'node_modules/pdfjs-dist/web')
        ]
      },
      {
        test: /\.(jpe?g|png|eot|woff|woff2|ttf|gif|svg)(\?.*)?$/i,
        loaders: ['url-loader', 'img-loader'],
        include: [
          path.join(__dirname, 'public'), 
          path.join(__dirname, 'app'),
          path.join(__dirname, 'node_modules/react-widgets/lib/fonts/'),
          path.join(__dirname, 'node_modules/font-awesome/fonts/'),
          path.join(__dirname, 'node_modules/react-widgets/lib/img/'),
          path.join(__dirname, 'node_modules/pdfjs-dist/web/images/'),
          path.join(__dirname, 'node_modules/pdfjs-dist/web/images/'),
          path.join(__dirname, 'node_modules/bootstrap/dist/fonts/')
        ]
      },
      {
        test:/\.json$/i,
        loaders: ['json-loader'],
        include: [
          path.join(__dirname, 'app')
          //path.join(__dirname, 'node_modules')
        ]
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('style.css'),
    //new webpack.optimize.OccurenceOrderPlugin(),
    new CleanPlugin({
      files: ['dist/*']
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
        screw_ie8: true
      }
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      },

      __CLIENT__: true,
      __SERVER__: false,
      __DEVELOPMENT__: false,
      __DEVTOOLS__: false
    })
  ]
};
