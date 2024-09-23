import { tenants } from '../app/api/tenants';
import { DB } from '../app/api/odm';
import { config } from '../app/api/config';
import { files } from '../app/api/files';
import { storage } from '../app/api/files/storage';

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
    const allFilesInDb: FileRecord[] = await files.get({});
    const allFilesInStorage = await storage.listFiles();
    const filteredFilesInStorage = new Set(filterFilesInStorage(allFilesInStorage));
    let missingInStorage = 0;
    const countInStorage = filteredFilesInStorage.size;
    let count = 0;

    allFilesInDb.forEach(file => {
      count += 1;
      const existsInStorage = filteredFilesInStorage.delete(
        storage.getPath(file.filename, file.type)
      );

      if (!existsInStorage && !(file.type === 'attachment' && file.url)) {
        missingInStorage += 1;
        print(
          {
            logType: 'missingInStorage',
            tenant: tenants.current().name,
            file,
          },
          'error'
        );
      }
    });

    filteredFilesInStorage.forEach(file => {
      print(
        {
          logType: 'missingInDb',
          tenant: tenants.current().name,
          file,
        },
        'error'
      );
    });

    print({
      logType: 'summary',
      tenant: tenants.current().name,
      storage: tenants.current().featureFlags?.s3Storage ? 's3' : 'local',
      missingInStorage,
      missingInDb: filteredFilesInStorage.size,
      countInDb: allFilesInDb.length,
      countInStorage,
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
