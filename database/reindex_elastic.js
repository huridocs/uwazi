import connect, { disconnect } from 'api/utils/connect_to_mongo';
import request from '../app/shared/JSONRequest';
import search from '../app/api/search/search';
import elasticMapping from './elastic_mapping';

import indexConfig from '../app/api/config/elasticIndexes';
import entities from '../app/api/entities/entities';
import relationships from '../app/api/relationships/relationships';

connect()
.then(() => {
  const limit = 200;
  let docsIndexed = 0;
  const relationshipsIndexed = 0;
  let pos = 0;
  const spinner = ['|', '/', '-', '\\'];

  function indexEntities() {
    return entities.indexEntities({}, '+fullText', 200, (indexed) => {
      process.stdout.write(`Indexing documents and entities... ${spinner[pos]} - ${docsIndexed} indexed\r`);
      pos += 1;
      if (pos > 3) {
        pos = 0;
      }
      docsIndexed += indexed;
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
  .then(() => indexEntities())
  .then(() => {
    process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
  })
  .then(() => {
    const end = Date.now();
    process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
    return disconnect();
  })
  .catch((error) => {
    console.log('Migration error: ', error);
  });
});
