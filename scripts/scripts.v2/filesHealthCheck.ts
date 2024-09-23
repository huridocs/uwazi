import { S3Client } from '@aws-sdk/client-s3';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { config } from 'api/config';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FilesHealthCheck } from 'api/files.v2/FilesHealthCheck';
import { S3FileStorage } from 'api/files.v2/infrastructure/S3FileStorage';
import { DB } from 'api/odm';
import { tenants } from 'api/tenants';

const { tenant, allTenants } = require('yargs')
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

let dbAuth = {};

if (process.env.DBUSER) {
  dbAuth = {
    auth: { authSource: 'admin' },
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  };
}

const LINE_PREFIX = process.env.LINE_PREFIX || '%> ';

function print(content: any, error?: 'error') {
  process[error ? 'stderr' : 'stdout'].write(`${LINE_PREFIX}${JSON.stringify(content)}\n`);
}

type FileRecord = { type: string; filename: string; url?: string };

function filterFilesInStorage(files: string[]) {
  return files.filter(file => !file.endsWith('activity.log'));
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
          file,
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
      countInDb: result.countInDb,
      countInStorage: result.countInStorage,
    });
  }, tenantName);
}

async function run() {
  await DB.connect(config.DBHOST, dbAuth);
  await tenants.setupTenants();

  if (!allTenants) {
    return await handleTenant(tenant);
  }

  await Object.keys(tenants.tenants).reduce(async (prev, tenantName) => {
    await prev;
    await handleTenant(tenantName);
  }, Promise.resolve());
}

run().finally(() => {
  process.exit();
});
