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

const setReindexSettings = async (
  indexUrl,
  refreshInterval,
  numberOfReplicas,
  translogDurability
) =>
  request.put(`${indexUrl}/_settings`, {
    index: {
      refresh_interval: refreshInterval,
      number_of_replicas: numberOfReplicas,
      translog: {
        durability: translogDurability,
      },
    },
  });

const tweakSettingsForPerformmance = async indexUrl => {
  process.stdout.write('Tweaking index settings for reindex performance...\n');
  return setReindexSettings(indexUrl, -1, 0, 'async');
};

const restoreSettings = async indexUrl => {
  process.stdout.write('Restoring index settings...\n');
  return setReindexSettings(indexUrl, '1s', 1, 'request');
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

const done = start => {
  const end = Date.now();
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
  errorLog.closeGraylog();
};

/*eslint-disable max-statements*/
connect().then(async () => {
  const start = Date.now();
  const elasticUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  const indexUrl = `${elasticUrl}/${indexConfig.index}`;

  try {
    await prepareIndex(indexUrl);
    await tweakSettingsForPerformmance(indexUrl);
    await reindex(indexUrl);
    await restoreSettings(indexUrl);
  } catch (err) {
    logErrors(err);
  }

  done(start);
  return disconnect();
});
