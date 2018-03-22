var exec = require('child_process').exec;
require('babel-core/register')(); //babel polyfill ES6
var mongoose = require('mongoose');
mongoose.Promise = Promise;

process.on('warning', (warning) => {
  console.log(warning.name);
  console.log(warning.message);
  console.log(warning.stack);
});

var verbose = false;
var folder = '**';

if (process.argv[2] === '--v') {
  verbose = true;
} else {
  folder = process.argv[2] ? process.argv[2] + '/**' : folder;
}

var Jasmine = require('jasmine');
var jasmine = new Jasmine();
var SpecReporter = require('jasmine-spec-reporter').SpecReporter;

jasmine.loadConfig({
  spec_dir: 'app/',
  spec_files: [
    `api/${folder}/*[sS]pec.js`,
    'shared/**/*[sS]pec.js'
  ],
  helpers: [
    '/api/utils/jasmineHelpers.js'
  ]
});

jasmine.addReporter(new SpecReporter({
  spec: {
    //displayStacktrace: 'summary',
    displaySuccessful: verbose,
    displayFailedSpec: true,
    displaySpecDuration: true
  }
}));

jasmine.execute();
