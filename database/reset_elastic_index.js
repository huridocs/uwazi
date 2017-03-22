/* eslint-disable camelcase, no-console */
import request from '../app/shared/JSONRequest';
import search from '../app/api/search/search';
import elasticMapping from './elastic_mapping';

import indexConfig from '../app/api/config/elasticIndexes';
import entities from '../app/api/entities/entitiesModel';
import mongoose from 'mongoose';

const limit = 200;
let docsIndexed = 0;
let pos = 0;
let spinner = ['|', '/', '-', '\\'];

function migrate(offset, totalRows) {
  return entities.get({}, '+fullText', {skip: offset, limit})
  .then((docsResponse) => {
    if (offset >= totalRows) {
      return;
    }

    return search.bulkIndex(docsResponse, 'index')
    .then(() => {
      process.stdout.write(`Indexing documents and entities... ${spinner[pos]} - ${docsIndexed} indexed\r`);
      pos += 1;
      if (pos > 3) {
        pos = 0;
      }
      docsIndexed += docsResponse.length;
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
  request.put(indexUrl, elasticMapping).catch(console.log);
})
.then(() => {
  return entities.count()
  .then((total_rows) => {
    return migrate(0, total_rows)
    .catch((error) => {
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
