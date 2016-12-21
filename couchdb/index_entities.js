require('babel-core/register')({
  presets: ['es2015', 'react'],
  plugins: [
    ['babel-plugin-module-alias', [
      {src: '../app/react', expose: 'app'},
      {src: '../app/shared', expose: 'shared'},
      {src: '../app/api', expose: 'api'}
    ]],
    'transform-class-properties',
    'add-module-exports'
  ]
});

var db_config = require('../app/api/config/database.js');
db_config.db_url = db_config.development;

var indexConfig = require('../app/api/config/elasticIndexes.js');
indexConfig.index = indexConfig.development;

var request = require('../app/shared/JSONRequest');
var P = require('bluebird');
var ID = require('../app/shared/uniqueID');
var search = require('../app/api/search/search');

var limit = 50;

function migrateDoc(doc) {
  return search.index(doc);
}

var pos = 0;
var spinner = ['|', '/', '-', '\\'];

function migrate(offset) {
  return request.default.get(db_config.db_url + '/_all_docs?limit=' + limit + '&skip=' + offset)
  .then(function(docsResponse) {
    if (offset >= docsResponse.json.total_rows) {
      return;
    }

    return P.resolve(docsResponse.json.rows).map(function(_doc) {
      return request.default.get(db_config.db_url + '/' + _doc.id)
      .then(function(response) {
        var doc = response.json;
        process.stdout.write('Indexing documents... ' + spinner[pos] + '\r');
        if (doc.type === 'document' || doc.type === 'entity') {
          return migrateDoc(doc);
        }
      });
    }, {concurrency: 1})
    .then(function() {
      pos += 1;
      if(pos > 3) {pos = 0;}
      return migrate(docsResponse.json.offset + limit);
    });
  })
  .catch(function(error) {
    console.log('migrate', error);
  });
}

migrate(0);
