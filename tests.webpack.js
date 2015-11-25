require('es6-promise').polyfill();
var context = require.context('./app', true, /\.spec\.js$/); //make sure you have your directory and regex test set correctly!
context.keys().forEach(context)
