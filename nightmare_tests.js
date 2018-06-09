/* eslint-disable */
require('babel-core/register')();

var Jasmine = require('jasmine');
var jasmine = new Jasmine();
var reporters = require('jasmine-reporters');
var exec = require('child_process').exec;

var dbConfig = require('./app/api/config/database.js');

var systemKeys = require('./app/api/i18n/systemKeys.js');
var translations = require('./app/api/i18n/translations.js');

var mongoose = require('mongoose');
mongoose.Promise = Promise;

let jasmineConfig = {
  spec_dir: '/',
  spec_files: [
    'nightmare/helpers/extensions.js',
    'nightmare/helpers/connectionsDSL.js',
    'nightmare/helpers/LibraryDSL.js'
  ]
}

let suite = 'nightmare/**/*.spec.js';

if(process.argv[2]) {
    suite = 'nightmare/paths/' + process.argv[2] + '.spec.js';
}

jasmineConfig.spec_files.push(suite);

jasmine.loadConfig(jasmineConfig);

jasmine.clearReporters();
jasmine.addReporter(new reporters.TerminalReporter({
  verbosity: 3,
  color: true,
  showStack: true
}));

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

mongoose.connect(dbConfig.development, {useMongoClient: true});
var db = mongoose.connection;
db.once('open', function () {
  exec('cd nightmare/fixtures;./restore.sh', (error) => {
    if (error) {
      console.log(error);
      return;
    }
    translations.processSystemKeys(systemKeys)
    .then(() => {
      jasmine.execute();
    })
    .catch(console.log);
  })
  .stdout.pipe(process.stdout);
});
