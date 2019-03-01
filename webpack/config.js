/* eslint-disable */
"use strict";

var path = require("path");
var webpack = require("webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var CopyWebpackPlugin = require("copy-webpack-plugin");

var rootPath = __dirname + "/../";

var AssetsPlugin = require("assets-webpack-plugin");
var assetsPluginInstance = new AssetsPlugin({
  path: path.join(rootPath + "/dist/")
});

module.exports = function(production) {
  var stylesName = "[name].css";
  var jsChunkHashName = "";

  if (production) {
    stylesName = "[name].[contenthash].css";
    jsChunkHashName = ".[chunkhash]";
  }

  return {
    context: rootPath,
    devtool: "#eval-source-map",
    mode: "development",
    entry: {
      main: path.join(rootPath, "app/react/index.js"),
      nprogress: path.join(rootPath, "node_modules/nprogress/nprogress.js"),
    },
    output: {
      path: path.join(rootPath, "/dist/"),
      publicPath: "/",
      filename: "[name]" + jsChunkHashName + ".js"
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            chunks: "all",
            test: /node_modules/
          }
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: "babel-loader?cacheDirectory",
          include: path.join(rootPath, "app"),
          exclude: /node_modules/
        },
        {
          test: /\.s?[ac]ss$/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: "css-loader", options: { url: false, sourceMap: true } },
            { loader: "sass-loader", options: { sourceMap: true } }
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin([path.join(rootPath, "/dist/*")], {
        root: rootPath
      }),

      new MiniCssExtractPlugin({
        filename: stylesName
      }),
      assetsPluginInstance
    ]
  };
};
