import { config } from 'api/config';
import { DB } from 'api/odm';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { elastic, search } from 'api/search';
import { IndexError } from 'api/search/entitiesIndex';
import { tenants } from 'api/tenants/tenantContext';
import elasticMapping from './elastic_mapping/elastic_mapping';

import { legacyLogger } from '../app/api/log';
import templatesModel from '../app/api/core/v1_layer/templates';
import elasticMapFactory from './elastic_mapping/elasticMapFactory';
import { tenantsModel } from 'api/tenants/tenantsModel';

const setReindexSettings = async (refreshInterval, numberOfReplicas, translogDurability) =>
  elastic.indices.putSettings({
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

  const tenantReplicas = tenants.current().featureFlags?.esReplicas || 0;

  if (tenants.current().featureFlags?.esReplicas) {
    process.stdout.write('restoring ES Replicas...');
  }

  const result = setReindexSettings('1s', tenantReplicas, 'request');
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
  process.stdout.write(`Deleting index ${tenants.current().indexName}...`);
  try {
    await elastic.indices.delete({});
  } catch (err) {
    if (err?.meta?.body?.error?.type === 'index_not_found_exception') {
      process.stdout.write('\r\nThe index was not found when trying to delete it, moving on\r\n');
    } else {
      throw err;
    }
  }
  process.stdout.write(' [done]\n');

  process.stdout.write(`Creating index ${tenants.current().indexName}...\r\n`);
  process.stdout.write(' - Base properties mapping\r\n');

  await elastic.indices.create({ body: elasticMapping });

  process.stdout.write(' - Custom templates mapping\r\n');
  const templates = await templatesModel.get();
  const templatesMapping = await elasticMapFactory.mapping(templates);
  await elastic.indices.putMapping({ body: templatesMapping });
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

DB.connect(config.DBHOST, config.DBAUTH).then(async () => {
  const start = Date.now();
  const tenantsDS = await tenantsModel();
  await tenantsDS.initialize();
  await tenants.setupTenants(tenantsDS);

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
  }, process.env.UWAZI_TENANT || config.defaultTenant.name);

  const end = Date.now();
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
});
