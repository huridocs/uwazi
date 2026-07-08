import { DB } from '#api/odm/index.js';
import { runMigration } from '#api/migrations/migrate.js';
import { runNewMigration } from '#api/migrations/MigrationService.js';

const MIGRATION_RESULT_PREFIX = '__UWAZI_MIGRATE_RESULT__=';

const isNewFlow = process.argv.includes('--new');
const isAsync = process.argv.includes('--async');
const structuredLogs = process.argv.includes('--structured-logs');

process.on('unhandledRejection', error => {
  throw error;
});

const run = isNewFlow ? () => runNewMigration({ async: isAsync, structuredLogs }) : runMigration;

run()
  .then(result => {
    if (!isNewFlow) {
      process.stdout.write(`${MIGRATION_RESULT_PREFIX}${JSON.stringify(result)}\n`);
    }

    const hasError = 'error' in result;
    const isBlocked = 'blocked' in result && result.blocked;
    const isDone = 'done' in result && result.done;
    const isDispatched = 'dispatched' in result && result.dispatched;

    if (hasError || (isBlocked && !isDone && !isDispatched)) {
      process.exitCode = 1;
    }
  })
  .catch(async e => {
    if (!isNewFlow) {
      process.stderr.write(`${MIGRATION_RESULT_PREFIX}${JSON.stringify({ error: e.message })}\n`);
    }
    await DB.disconnect();
    process.exit(1);
  });
