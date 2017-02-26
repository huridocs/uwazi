require('babel-core/register')({
  "presets": ["es2015", "react"],
  "retainLines": "true",
  "plugins": [
    "transform-class-properties",
    "add-module-exports",
    ['module-resolver', {
      alias: {
        app: '../app/react',
        shared: '../app/shared',
        api: '../app/api'
      }
    }]
  ]
});

var dbConfig = require('../app/api/config/database.js');

var indexConfig = require('../app/api/config/elasticIndexes.js');
indexConfig.index = indexConfig.development;

var mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(dbConfig.development);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  require('./reset_elastic_index.js');
});
