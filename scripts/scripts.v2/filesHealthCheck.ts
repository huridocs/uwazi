import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { S3Client } from '@aws-sdk/client-s3';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { config } from '#api/config.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesHealthCheck } from '#api/core/application/FilesHealthCheck.js';
import { S3FileStorage } from '#api/core/infrastructure/files/S3FileStorage.js';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';

const { tenant, allTenants } = yargs(hideBin(process.argv))
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'Tenant to check',
    default: undefined,
  })
  .option('allTenants', {
    alias: 'a',
    type: 'boolean',
    default: false,
  })
  .parseSync();

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

    const filesHealthCheck = new FilesHealthCheck(
      new S3FileStorage(s3Client, new FileContentsIO(), tenants.current()),
      FilesDataSourceFactory.default()
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
    await handleTenant(tenant || 'default');
  } else {
    await Object.keys(tenants.tenants).reduce(async (prev, tenantName) => {
      await prev;
      await handleTenant(tenantName);
    }, Promise.resolve());
  }
  await tenants.model?.closeChangeStream();
  await DB.disconnect();
})();
