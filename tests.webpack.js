//require('es6-promise').polyfill();
// require('whatwg-fetch');
var context = require.context('./app/react', true, /\.spec\.js$/); //make sure you have your directory and regex test set correctly!
context.keys().forEach(context)
