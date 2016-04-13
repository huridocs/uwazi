require('babel-core/register')({
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
var reporters = require('jasmine-reporters');

var db_config = require('./app/api/config/database.js');
db_config.db_url = db_config.development;

jasmine.loadConfig({
    spec_dir: '/',
    spec_files: [
      'nightmare/**/*[sS]pec.js'
    ]
});

jasmine.addReporter(new reporters.TerminalReporter({
  verbosity: 2,
  color: true,
  showStack: true
}));

jasmine.execute();
