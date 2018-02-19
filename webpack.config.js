/* eslint-disable */
'use strict';

var config = require('./webpack/config')();

config.context = __dirname;

module.exports = config;
