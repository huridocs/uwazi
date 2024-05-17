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

type FileRecord = { type: string; filename: string };
function getMap(files: FileRecord[]) {
  const mapped: Record<string, Record<string, FileRecord>> = {};
  files.forEach(file => {
    if (!mapped[file.type]) {
      mapped[file.type] = {};
    }
    mapped[file.type][file.filename] = file;
  });
  return mapped;
}

function check(
  source: FileRecord[],
  target: FileRecord[],
  { logType, excludeTypes }: { logType: string; excludeTypes?: string[] }
) {
  let missing = 0;
  const mapped = getMap(target);

  source.forEach(file => {
    if (!(excludeTypes ?? []).includes(file.type)) {
      const exists = mapped[file.type]?.[file.filename];
      if (!exists) {
        missing += 1;
        print(
          {
            logType,
            tenant: tenants.current().name,
            file,
          },
          'error'
        );
      }
    }
  });

  return missing;
}

async function handleTenant(tenantName: string) {
  await tenants.run(async () => {
    const allFilesInDb = await files.get({});
    const allFilesInStorage = await storage.listFiles();

    const missingInStorage = check(allFilesInDb, allFilesInStorage, {
      logType: 'missingInStorage',
    });
    const missingInDb = check(allFilesInStorage, allFilesInDb, {
      logType: 'missingInDb',
      excludeTypes: ['activitylog'],
    });

    print({
      logType: 'summary',
      tenant: tenants.current().name,
      storage: tenants.current().featureFlags?.s3Storage ? 's3' : 'local',
      missingInStorage,
      missingInDb,
      count: allFilesInDb.length,
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
