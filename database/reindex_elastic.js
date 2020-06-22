import connect, { disconnect } from 'api/utils/connect_to_mongo';
import request from '../app/shared/JSONRequest';
import elasticMapping from './elastic_mapping';

import indexConfig from '../app/api/config/elasticIndexes';
import { search } from '../app/api/search';
import { IndexError } from '../app/api/search/entitiesIndex';

const indexEntities = async () => {
  const spinner = ['|', '/', '-', '\\'];
  let docsIndexed = 0;
  let pos = 0;

  await search.indexEntities({}, '+fullText', 50, indexed => {
    process.stdout.write(
      `Indexing documents and entities... ${spinner[pos]} - ${docsIndexed} indexed\r`
    );
    pos = (pos + 1) % 4;
    docsIndexed += indexed;
  });

  return docsIndexed;
};

const prepareIndex = async indexUrl => {
  process.stdout.write(`Deleting index... ${indexConfig.index}\n`);
  await request.delete(indexUrl);

  process.stdout.write(`Creating index... ${indexConfig.index}\n`);
  await request.put(indexUrl, elasticMapping);
};

const reindex = async () => {
  const docsIndexed = await indexEntities();
  process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
};

const logErrors = err => {
  if (err instanceof IndexError) {
    process.stdout.write('\r\nWarning! The following errors found during reindex:\r\n');
    process.stdout.write(`${JSON.stringify(err.errors, null, ' ')}\r\n`);
  } else {
    process.stdout.write('Reindex error:\r\n');
    process.stdout.write(`${err}\r\n`);
    process.exit(1);
  }
  return disconnect();
};

connect().then(async () => {
  const start = Date.now();
  const elasticUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  const indexUrl = `${elasticUrl}/${indexConfig.index}`;

  try {
    await prepareIndex(indexUrl);
    await reindex();

    const end = Date.now();
    process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
    return disconnect();
  } catch (err) {
    return logErrors(err);
  }
});
