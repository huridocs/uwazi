require('es6-promise').polyfill();
require('isomorphic-fetch');

// lots of errors to debug ...
var error = console.error.bind(console);
console.error = function(message){
  if (message.match('/api/i18n/systemKeys')) {
    return;
  }
  error(message);
};
//console.error = () => {};
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({adapter: new Adapter()});

// This gets replaced by karma webpack with the updated files on rebuild
var __karmaWebpackManifest__ = [];

// require all modules ending in "_test" from the
// current directory and all subdirectories
var testsContext = require.context('./app/react', true, /\.spec\.js$/); //make sure you have your directory and regex test set correctly!

function inManifest(path) {
  return __karmaWebpackManifest__.indexOf(path) >= 0;
}

var runnable = testsContext.keys().filter(inManifest);

// Run all tests if we didn't find any changes
if (!runnable.length) {
  runnable = testsContext.keys();
}

runnable.forEach(testsContext);
