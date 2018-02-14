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

jasmine.loadConfig({
  spec_dir: '/',
  spec_files: [
    'nightmare/helpers/extensions.js',
    'nightmare/**/*.spec.js'
  ]
});

jasmine.clearReporters();
jasmine.addReporter(new reporters.TerminalReporter({
  verbosity: 3,
  color: true,
  showStack: true
}));

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
