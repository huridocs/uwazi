require('babel-core/register')();
var fs = require('fs');

if (process.argv[2]) {
  var migrationFile = process.argv[2];
  if (!fs.existsSync(migrationFile)) {
    console.log(`Migration ${process.argv[2]} do not exist !!`);
  }
}

var dbConfig = require('./app/api/config/database.js');
var mongoose = require('mongoose');
var indexConfig = require('./app/api/config/elasticIndexes.js');
indexConfig.index = indexConfig.development;
mongoose.Promise = Promise;
mongoose.connect(dbConfig.development, {useMongoClient: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  require(migrationFile || './app/api/migrations/fix_entity_based_references.js');
});
