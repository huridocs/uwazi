import { config } from 'api/config';
import { tenants } from 'api/tenants/tenantContext';
import { DB } from 'api/odm';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { IndexError } from 'api/search/entitiesIndex';
import { search } from 'api/search';
import dictionariesModel from 'api/thesauri/dictionariesModel';
import elasticMapping from './elastic_mapping/elastic_mapping';

import templatesModel from '../app/api/templates';
import elasticMapFactory from './elastic_mapping/elasticMapFactory';
import { legacyLogger } from '../app/api/log';

const getIndexUrl = () => {
  const elasticUrl = config.elasticsearch_nodes[0];
  return `${elasticUrl}/${config.defaultTenant.indexName}`;
};

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const setReindexSettings = async (refreshInterval, numberOfReplicas, translogDurability) =>
  fetch(`${getIndexUrl()}/_settings`, {
    method: 'PUT',
    headers,
    body: {
      index: {
        refresh_interval: refreshInterval,
        number_of_replicas: numberOfReplicas,
        translog: {
          durability: translogDurability,
        },
      },
    },
  });

const restoreSettings = async () => {
  process.stdout.write('Restoring index settings...');
  const result = setReindexSettings('1s', 0, 'request');
  process.stdout.write(' [done]\n');
  return result;
};

const endScriptProcedures = async () =>
  new Promise((resolve, reject) => {
    (async () => {
      try {
        await restoreSettings();
        await DB.disconnect();
        resolve();
      } catch (err) {
        reject(err);
      }
    })();
  });

const indexEntities = async () => {
  const spinner = ['|', '/', '-', '\\'];
  let docsIndexed = 0;
  let pos = 0;

  await search.indexEntities({}, '+fullText', 10, indexed => {
    process.stdout.write(
      `Indexing documents and entities... ${spinner[pos]} - ${docsIndexed} indexed\r`
    );
    pos = (pos + 1) % 4;
    docsIndexed += indexed;
  });

  return docsIndexed;
};

/*eslint-disable max-statements*/
const prepareIndex = async () => {
  process.stdout.write(`Deleting index ${config.defaultTenant.indexName}...`);
  try {
    await fetch(getIndexUrl(), { method: 'delete' });
  } catch (err) {
    // Should not stop on index_not_found_exception
    if (err.json.error.type === 'index_not_found_exception') {
      process.stdout.write('\r\nThe index was not found:\r\n');
      process.stdout.write(`${JSON.stringify(err, null, ' ')}\r\nMoving on.\r\n`);
    } else {
      throw err;
    }
  }
  process.stdout.write(' [done]\n');

  process.stdout.write(`Creating index ${config.defaultTenant.indexName}...\r\n`);
  process.stdout.write(' - Base properties mapping\r\n');

  await fetch(getIndexUrl(), {
    headers,
    method: 'PUT',
    body: JSON.stringify(elasticMapping),
  });

  process.stdout.write(' - Custom templates mapping\r\n');
  const templates = await templatesModel.get();
  const dictionaries = await dictionariesModel.get({ enable_classification: true });
  const templatesMapping = await elasticMapFactory.mapping(templates, !!dictionaries.length);
  await fetch(`${getIndexUrl()}/_mapping`, {
    headers,
    method: 'PUT',
    body: JSON.stringify(templatesMapping),
  });
  process.stdout.write(' [done]\n');
};

const tweakSettingsForPerformmance = async () => {
  process.stdout.write('Tweaking index settings for reindex performance...');
  const result = setReindexSettings(-1, 0, 'async');
  process.stdout.write(' [done]\n');
  return result;
};

const reindex = async () => {
  process.stdout.write('Starting reindex...\r\n');
  const docsIndexed = await indexEntities();
  process.stdout.write(`Indexing documents and entities... - ${docsIndexed} indexed\r\n`);
};

const processErrors = async err => {
  if (err instanceof IndexError) {
    process.stdout.write('\r\nWarning! Errors found during reindex.\r\n');
  } else {
    const errorMsg =
      err instanceof Error
        ? `${err.message}\r\n${JSON.stringify(err, null, ' ')}`
        : JSON.stringify(err, null, ' ');
    legacyLogger.error(`Uncaught Reindex error.\r\n${errorMsg}\r\nWill exit with (1)\r\n`);
    await endScriptProcedures();
    throw err;
  }
};

process.on('unhandledRejection', error => {
  throw error;
});

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

DB.connect(config.DBHOST, dbAuth).then(async () => {
  const start = Date.now();

  await tenants.run(async () => {
    try {
      permissionsContext.setCommandContext();
      await prepareIndex();
      await tweakSettingsForPerformmance();
      await reindex();
    } catch (err) {
      await processErrors(err);
    }
    await endScriptProcedures();
  });

  const end = Date.now();
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
});
