import { spawn } from 'child_process';
import { DB } from '#api/odm/index.js';
import { config } from '#api/config.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { migrator } from '#api/migrations/migrator.js';

const runYarn = (args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn('yarn', args, { stdio: 'inherit', env: process.env });
    child.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`yarn ${args.join(' ')} failed with exit code ${code}`));
    });
    child.on('error', reject);
  });

const shouldRunMigrationCheck = () => {
  const skipMigrationCheck = process.env.SKIP_MIGRATION_CHECK === 'true';
  return !skipMigrationCheck && !config.multiTenant && !config.clusterMode;
};

const checkShouldMigrate = async () => {
  await DB.connect(config.DBHOST, config.DBAUTH);
  try {
    return tenants.run(async () => migrator.shouldMigrate());
  } finally {
    await DB.disconnect();
  }
};

const main = async () => {
  if (!shouldRunMigrationCheck()) {
    return;
  }

  const shouldMigrate = await checkShouldMigrate();
  if (!shouldMigrate) {
    return;
  }

  console.info('==> Pending migrations detected. Running yarn migrate and yarn reindex...');
  await runYarn(['migrate']);
  await runYarn(['reindex']);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
