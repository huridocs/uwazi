/** @format */

import connect, { disconnect } from 'api/utils/connect_to_mongo';
import request from '../app/shared/JSONRequest';
import elasticMapping from './elastic_mapping';

import indexConfig from '../app/api/config/elasticIndexes';
import { search } from '../app/api/search';

connect().then(() => {
  let docsIndexed = 0;
  let pos = 0;
  const spinner = ['|', '/', '-', '\\'];

  function indexEntities() {
    return search.indexEntities(
      {},
      '+fullText',
      50,
      indexed => {
        process.stdout.write(
          `Indexing documents and entities... ${spinner[pos]} - ${docsIndexed} indexed\r`
        );
        pos = (pos + 1) % 4;
        docsIndexed += indexed;
      },
      { continueOnIndexError: true }
    );
  }

  const start = Date.now();
  process.stdout.write(`Deleting index... ${indexConfig.index}\n`);
  const elasticUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  const indexUrl = `${elasticUrl}/${indexConfig.index}`;
  request
    .delete(indexUrl)
    .catch(console.log)
    .then(() => {
      process.stdout.write(`Creating index... ${indexConfig.index}\n`);
      return request.put(indexUrl, elasticMapping).catch(console.log);
    })
    .then(() => indexEntities())
    .then(({ errors }) => {
      process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
      if (errors.length) {
        process.stdout.write('Warning! Errors found during reindex:\r\n');
        process.stdout.write(`${JSON.stringify(errors, null, ' ')}\r\n`);
      }
    })
    .then(() => {
      const end = Date.now();
      process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
      return disconnect();
    })
    .catch(error => {
      console.log('Indexing error: ', error);
      process.exit(1);
    });
});
