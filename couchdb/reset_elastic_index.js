import request from '../app/shared/JSONRequest';
import P from 'bluebird';
import search from '../app/api/search/search';
import elastic_mapping from './elastic_mapping';

import db_config from '../app/api/config/database';
import indexConfig from '../app/api/config/elasticIndexes';

const limit = 50;
const start = Date.now();
let end;

let docsIndexed = 0;
function migrateDoc(doc) {
  docsIndexed += 1;
  return search.index(doc);
}

let pos = 0;

let spinner = ['|', '/', '-', '\\'];
function migrate(offset) {
  return request.get(db_config.db_url + '/_all_docs?limit=' + limit + '&skip=' + offset)
  .then(function(docsResponse) {
    if (offset >= docsResponse.json.total_rows) {
      end = Date.now();
      return;
    }

    return P.resolve(docsResponse.json.rows).map(function(_doc) {
      return request.get(db_config.db_url + '/' + _doc.id)
      .then(function(response) {
        let doc = response.json;
        process.stdout.write(`Indexing documents and entities... ${spinner[pos]} - ${docsIndexed} indexed\r`);
        if (doc.type === 'document' || doc.type === 'entity') {
          return migrateDoc(doc).catch(console.log);
        }
      });
    }, {concurrency: 10})
    .then(function() {
      pos += 1;
      if(pos > 3) {pos = 0;}
      return migrate(docsResponse.json.offset + limit);
    });
  });
}

process.stdout.write(`Deleting index... ${indexConfig.index}\n`);
let indexUrl = `http://localhost:9200/${indexConfig.index}`;
request.delete(indexUrl)
.catch(console.log)
.then(() => {
  process.stdout.write(`Creating index... ${indexConfig.index}\n`);
  request.put(indexUrl, elastic_mapping).catch(console.log);
})
.then(() => {
  return migrate(0)
  .catch(function(error) {
    console.log('Migration error: ', error);
  });
})
.then(() => {
  process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
});
