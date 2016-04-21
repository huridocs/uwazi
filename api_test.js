require('babel-core/register')({
  "sourceMaps": "inline",
  "presets": ["es2015", "react"],
  "plugins": [
    ["babel-plugin-module-alias", [
      { "src": "./app/react", "expose": "app" },
      { "src": "./app/shared", "expose": "shared" },
      { "src": "./app/api", "expose": "api" }
    ]],
    "transform-class-properties",
    "add-module-exports"
  ]
}); //babel polyfill ES6

var Jasmine = require('jasmine');
var jasmine = new Jasmine();
var SpecReporter = require('jasmine-spec-reporter');

var db_config = require('./app/api/config/database.js');
db_config.db_url = db_config.development;

jasmine.loadConfig({
  spec_dir: 'app/',
  spec_files: [
    'api/**/*[sS]pec.js',
    'shared/**/*[sS]pec.js'
  ]
});

jasmine.addReporter(new SpecReporter({
  displayStacktrace: 'summary',
  displaySuccessfulSpec: false,
  displayFailedSpec: false,
  displaySpecDuration: true
}));

jasmine.execute();
