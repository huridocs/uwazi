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

var db_config = require('../app/api/config/database.js');
db_config.db_url = db_config.development;

var indexConfig = require('../app/api/config/elasticIndexes.js');
indexConfig.index = indexConfig.development;
require('./reset_elastic_index.js');
