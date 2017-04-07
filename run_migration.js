require('babel-core/register')();

var dbConfig = require('./app/api/config/database.js');
var mongoose = require('mongoose');
var indexConfig = require('./app/api/config/elasticIndexes.js');
indexConfig.index = indexConfig.development;
mongoose.Promise = Promise;
mongoose.connect(dbConfig.development);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  require('./app/api/migrations/sync_template_labels_names.js');
});

