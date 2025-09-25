import yargs from 'yargs';
import { S3Client } from '@aws-sdk/client-s3';
import { DefaultTransactionManager } from '../../app/api/common.v2/database/data_source_defaults.js';
import { config } from '../../app/api/config.js';
import { DefaultFilesDataSource } from '../../app/api/files.v2/database/data_source_defaults.js';
import { FilesHealthCheck } from '../../app/api/files.v2/FilesHealthCheck.js';
import { S3FileStorage } from '../../app/api/files.v2/infrastructure/S3FileStorage.js';
import { DB } from '../../app/api/odm/index.js';
import { tenants } from '../../app/api/tenants/index.js';

const { tenant, allTenants } = await yargs
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'Tenant to check',
    default: undefined,
  })
  .option('allTenants', {
    alias: 'a',
    type: 'boolean',
    describe: 'Tenant to check',
    default: false,
  }).argv;

const LINE_PREFIX = process.env.LINE_PREFIX || '%> ';

function print(content: any, error?: 'error') {
  process[error ? 'stderr' : 'stdout'].write(`${LINE_PREFIX}${JSON.stringify(content)}\n`);
}

async function handleTenant(tenantName: string) {
  await tenants.run(async () => {
    const s3Client = new S3Client({
      apiVersion: 'latest',
      region: 'region',
      ...config.s3,
    });

    const transactionManager = DefaultTransactionManager();
    const filesHealthCheck = new FilesHealthCheck(
      new S3FileStorage(s3Client, tenants.current()),
      DefaultFilesDataSource(transactionManager)
    );

    filesHealthCheck.onMissingInDB(file => {
      print(
        {
          logType: 'missingInDb',
          tenant: tenantName,
          ...file,
          file: file.filename,
        },
        'error'
      );
    });

    filesHealthCheck.onMissingInStorage(file => {
      print(
        {
          logType: 'missingInStorage',
          tenant: tenantName,
          file,
        },
        'error'
      );
    });

    const result = await filesHealthCheck.execute();

    print({
      logType: 'summary',
      tenant: tenantName,
      storage: tenants.current().featureFlags?.s3Storage ? 's3' : 'local',
      missingInStorage: result.missingInStorage,
      missingInDb: result.missingInDb,
      missingInDbWithChecksumMatches: result.missingInDbWithChecksumMatches,
      countInDb: result.countInDb,
      countInStorage: result.countInStorage,
    });
  }, tenantName);
}

(async function run() {
  await DB.connect(config.DBHOST, config.DBAUTH);
  await tenants.setupTenants();

  if (!allTenants) {
    await handleTenant(tenant);
  } else {
    await Object.keys(tenants.tenants).reduce(async (prev, tenantName) => {
      await prev;
      await handleTenant(tenantName);
    }, Promise.resolve());
  }
  await tenants.model?.closeChangeStream();
  await DB.disconnect();
})();
