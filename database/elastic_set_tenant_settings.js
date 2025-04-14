import { config } from 'api/config';
import { tenants } from 'api/tenants/tenantContext';
import { DB } from 'api/odm';
import { IndexError } from 'api/search/entitiesIndex';

import { legacyLogger } from '../app/api/log';

const getIndexUrl = () => {
  const elasticUrl = config.elasticsearch_nodes[0];
  return `${elasticUrl}/${tenants.current().indexName}`;
};

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const setIndexSettings = async numberOfReplicas => {
  const body = JSON.stringify({
    index: {
      number_of_replicas: numberOfReplicas,
    },
  });

  const result = await fetch(`${getIndexUrl()}/_settings`, {
    method: 'PUT',
    headers,
    body,
  });

  return result;
};

const setTenantSettings = async () => {
  const tenantReplicas = tenants.current().featureFlags?.esReplicas || 0;
  process.stdout.write(`Setting ${tenantReplicas} ES Replicas...`);
  const result = setIndexSettings(tenantReplicas);
  process.stdout.write(' [done]\r\n');
  return result;
};

const endScriptProcedures = async () =>
  new Promise((resolve, reject) => {
    (async () => {
      try {
        await DB.disconnect();
        resolve();
      } catch (err) {
        reject(err);
      }
    })();
  });

const processErrors = async err => {
  if (err instanceof IndexError) {
    process.stdout.write('\r\nWarning! Errors found during operation.\r\n');
  } else {
    const errorMsg =
      err instanceof Error
        ? `${err.message}\r\n${JSON.stringify(err, null, ' ')}`
        : JSON.stringify(err, null, ' ');
    legacyLogger.error(`Uncaught error.\r\n${errorMsg}\r\nWill exit with (1)\r\n`);
    await endScriptProcedures();
    throw err;
  }
};

process.on('unhandledRejection', error => {
  throw error;
});

DB.connect(config.DBHOST, config.DBAUTH).then(async () => {
  const start = Date.now();
  await tenants.setupTenants();

  await tenants.run(async () => {
    process.stdout.write(`Setting ES index settings for ${tenants.current().indexName}...\r\n`);
    try {
      await setTenantSettings();
    } catch (err) {
      processErrors(err);
    }
    await endScriptProcedures();
  }, process.env.UWAZI_TENANT || config.defaultTenant.name);

  const end = Date.now();
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
});
