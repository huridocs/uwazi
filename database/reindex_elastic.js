import connect, { disconnect } from 'api/utils/connect_to_mongo';
import request from '../app/shared/JSONRequest';
import elasticMapping from './elastic_mapping/elastic_mapping';

import indexConfig from '../app/api/config/elasticIndexes';
import { search } from '../app/api/search';
import { IndexError } from '../app/api/search/entitiesIndex';
import errorLog from '../app/api/log/errorLog';

const getIndexUrl = () => {
  const elasticUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  return `${elasticUrl}/${indexConfig.index}`;
};

const setReindexSettings = async (refreshInterval, numberOfReplicas, translogDurability) =>
  request.put(`${getIndexUrl()}/_settings`, {
    index: {
      refresh_interval: refreshInterval,
      number_of_replicas: numberOfReplicas,
      translog: {
        durability: translogDurability,
      },
    },
  });

const restoreSettings = async () => {
  process.stdout.write('Restoring index settings...\n');
  return setReindexSettings('1s', 1, 'request');
};

const endScriptProcedures = async () =>
  new Promise((resolve, reject) => {
    errorLog.closeGraylog(async () => {
      try {
        await restoreSettings();
        await disconnect();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

process.on('unhandledRejection', async error => {
  try {
    errorLog.error(error.message);
    await endScriptProcedures();
  } catch (err) {
    process.stdout.write(`\r\n${err.message}\r\n`);
  }
  process.exit(1);
});

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

const prepareIndex = async () => {
  process.stdout.write(`Deleting index... ${indexConfig.index}\n`);
  try {
    await request.delete(getIndexUrl());
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
  await request.put(getIndexUrl(), elasticMapping);
};

const tweakSettingsForPerformmance = async () => {
  process.stdout.write('Tweaking index settings for reindex performance...\n');
  return setReindexSettings(-1, 0, 'async');
};

const reindex = async () => {
  const docsIndexed = await indexEntities();
  process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
};

const logErrors = err => {
  if (err instanceof IndexError) {
    process.stdout.write('\r\nWarning! Errors found during reindex.\r\n');
  } else {
    errorLog.error(`Uncaught Reindex error.\r\n${err.message}\r\nWill exit with (1)\r\n`);
    throw err;
  }
};

const done = start => {
  const end = Date.now();
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
};

connect().then(async () => {
  const start = Date.now();

  try {
    await prepareIndex();
    await tweakSettingsForPerformmance();
    await reindex();
  } catch (err) {
    logErrors(err);
  }

  done(start);
  return endScriptProcedures();
});
