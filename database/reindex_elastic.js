import connect, { disconnect } from 'api/utils/connect_to_mongo';
import request from '../app/shared/JSONRequest';
import elasticMapping from './elastic_mapping';

import indexConfig from '../app/api/config/elasticIndexes';
import { search } from '../app/api/search';
import { IndexError } from '../app/api/search/entitiesIndex';
import errorLog from '../app/api/log/errorLog';

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
  try {
    await request.delete(indexUrl);
  } catch (err) {
    // Should not stop on index_not_found_exception
    if (err.json.error.type === 'index_not_found_exception') {
      process.stdout.write('\r\nThe index was not found:\r\n');
      process.stdout.write(`${JSON.stringify(err, null, ' ')}\r\n`);
      process.stdout.write('\r\nMoving on.\r\n');
    } else {
      throw err;
    }
  }

  process.stdout.write(`Creating index... ${indexConfig.index}\n`);
  await request.put(indexUrl, elasticMapping);
};

const reindex = async () => {
  const docsIndexed = await indexEntities();
  process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
};

const attemptStringify = err => {
  let errMessage = '';
  try {
    errMessage = JSON.stringify(err, null, ' ');
  } catch (_err) {
    errMessage = err;
  }

  return errMessage;
};

const logErrors = err => {
  if (err instanceof IndexError) {
    process.stdout.write('\r\nWarning! Errors found during reindex.\r\n');
  } else {
    const errMessage = attemptStringify(err);
    errorLog.error(`Uncaught Reindex error.\r\n${errMessage}\r\nWill exit with (1)\r\n`);
    process.exit(1);
  }
};

connect().then(async () => {
  const start = Date.now();
  const elasticUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  const indexUrl = `${elasticUrl}/${indexConfig.index}`;

  try {
    await prepareIndex(indexUrl);
    await reindex();
  } catch (err) {
    logErrors(err);
  }

  const end = Date.now();
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
  return disconnect();
});
