import request from '../app/shared/JSONRequest';
import P from 'bluebird';
import search from '../app/api/search/search';
import elastic_mapping from './elastic_mapping';

import db_config from '../app/api/config/database';
import indexConfig from '../app/api/config/elasticIndexes';
import entities from '../app/api/entities/entitiesModel';
import mongoose from 'mongoose';

const limit = 50;
let docsIndexed = 0;
function migrateDoc(doc) {
  docsIndexed += 1;
  return search.index(doc);
}

let pos = 0;
let spinner = ['|', '/', '-', '\\'];

function migrate(offset, totalRows) {
  return entities.get({}, '+fullText', {skip: offset, limit})
  .then(function(docsResponse) {
    if (offset >= totalRows) {
      return;
    }

    return P.resolve(docsResponse).map((doc) => {
      process.stdout.write(`Indexing documents and entities... ${spinner[pos]} - ${docsIndexed} indexed\r`);
      return migrateDoc(doc).catch(console.log);
    }, {concurrency: 10})
    .then(function() {
      pos += 1;
      if(pos > 3) {pos = 0;}
      return migrate(offset + limit, totalRows);
    });
  });
}

const start = Date.now();
process.stdout.write(`Deleting index... ${indexConfig.index}\n`);
let indexUrl = `http://localhost:9200/${indexConfig.index}`;
request.delete(indexUrl)
.catch(console.log)
.then(() => {
  process.stdout.write(`Creating index... ${indexConfig.index}\n`);
  request.put(indexUrl, elastic_mapping).catch(console.log);
})
.then(() => {
  return entities.count()
  .then((total_rows) => {
    return migrate(0, total_rows)
    .catch(function(error) {
      console.log('Migration error: ', error);
    });
  });
})
.then(() => {
  const end = Date.now();
  process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
  mongoose.disconnect();
});
