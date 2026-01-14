import yargs from 'yargs';
import { S3Client } from '@aws-sdk/client-s3';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { config } from 'api/config';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { FilesHealthCheck } from 'api/core/application/FilesHealthCheck';
import { S3FileStorage } from 'api/core/infrastructure/files/S3FileStorage';
import { DB } from 'api/odm';
import { tenants } from 'api/tenants';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';

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

    const transactionManager = TransactionManagerFactory.default();
    const filesHealthCheck = new FilesHealthCheck(
      new S3FileStorage(s3Client, new FileContentsIO(), tenants.current()),
      FilesDataSourceFactory.default(transactionManager)
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
