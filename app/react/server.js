var path = require('path');
var Router = require('./Router');
var express = require('express');

module.exports = function(app) {

  app.use(express.static(path.resolve(__dirname, 'dist')));

  app.get('*', Router);

}
