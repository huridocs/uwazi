require('babel-core/register')();

var db_config = require('../../app/api/config/database.js');
db_config.db_url = db_config.development;

var indexConfig = require('../app/api/config/elasticIndexes.js');
indexConfig.index = indexConfig.development;
require('./recover_references.js');
