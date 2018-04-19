import mongoose from 'mongoose';
import connect from './connect_to_mongo';
import request from '../app/shared/JSONRequest';
import search from '../app/api/search/search';
import elasticMapping from './elastic_mapping';

import indexConfig from '../app/api/config/elasticIndexes';
import entities from '../app/api/entities/entities';

connect()
.then(() => {
  const limit = 200;
  let docsIndexed = 0;
  let pos = 0;
  const spinner = ['|', '/', '-', '\\'];

  function migrate(offset, totalRows) {
    return entities.get({}, '+fullText', { skip: offset, limit })
    .then((docsResponse) => {
      if (offset >= totalRows) {
        return Promise.resolve();
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
      })
      .catch((err) => {
        console.log('ERR:', err);
      });
    });
  }

  const start = Date.now();
  process.stdout.write(`Deleting index... ${indexConfig.index}\n`);
  const elasticUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  const indexUrl = `${elasticUrl}/${indexConfig.index}`;
  request.delete(indexUrl)
  .catch(console.log)
  .then(() => {
    process.stdout.write(`Creating index... ${indexConfig.index}\n`);
    return request.put(indexUrl, elasticMapping).catch(console.log);
  })
  .then(() => entities.count()
  .then(totalRows => migrate(0, totalRows)
  .catch((error) => {
    console.log('Migration error: ', error);
  })))
  .then(() => {
    const end = Date.now();
    process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
    process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
    mongoose.disconnect();
  });
});
