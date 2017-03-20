require('babel-core/register')();

var dbConfig = require('./app/api/config/database.js');
var mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(dbConfig.development);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  require('./app/api/migrations/fix_multiple_language_state.js');
});

