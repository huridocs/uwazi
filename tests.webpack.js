require('es6-promise').polyfill();
// require('whatwg-fetch');
require('isomorphic-fetch');
console.error = function(){};
var context = require.context('./app/react', true, /\.spec\.js$/); //make sure you have your directory and regex test set correctly!
context.keys().forEach(context)
