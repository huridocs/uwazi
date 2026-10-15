import { DB } from '#api/odm/index.js';
import { runMigration } from '#api/migrations/migrate.js';
import { runNewMigration, migrationStatus } from '#api/migrations/MigrationService.js';

const MIGRATION_RESULT_PREFIX = '__UWAZI_MIGRATE_RESULT__=';

const isStatus = process.argv.includes('--status');
const isNewFlow = process.argv.includes('--new');
const isAsync = process.argv.includes('--async');
const structuredLogs = process.argv.includes('--structured-logs');

process.on('unhandledRejection', error => {
  throw error;
});

const formatStatus = ({ postgres, mongo }) => {
  const tenants = Object.entries(mongo.pendingByTenant);
  return [
    `Postgres: ${postgres.applied.length} applied, ${postgres.pending.length} pending`,
    ...postgres.pending.map(
      ({ delta, name, kind, outOfOrder }) =>
        `  ${delta} ${name} (${kind})${outOfOrder ? ' OUT OF ORDER: will be refused, renumber it' : ''}`
    ),
    `Mongo: ${tenants.length} tenant(s) with pending migrations`,
    ...tenants.map(([tenant, deltas]) => `  ${tenant}: ${deltas.join(', ')}`),
    '',
  ].join('\n');
};

const printStatus = async () => {
  process.stdout.write(formatStatus(await migrationStatus()));
};

const migrate = async () => {
  const run = isNewFlow
    ? async () => runNewMigration({ async: isAsync, structuredLogs })
    : runMigration;

  return run()
    .then(result => {
      if (!isNewFlow) {
        process.stdout.write(`${MIGRATION_RESULT_PREFIX}${JSON.stringify(result)}\n`);
      }

      const hasError = 'error' in result;
      const isBlocked = 'blocked' in result && result.blocked;
      const isDone = 'done' in result && result.done;
      const isDispatched = 'dispatched' in result && result.dispatched;
      const isSkipped = 'skipped' in result && result.skipped;

      if (hasError || (isBlocked && !isDone && !isDispatched)) {
        process.exitCode = 1;
      }

      if (isSkipped) {
        process.stdout.write(`Migration skipped: ${result.reason}\n`);
      }
    })
    .catch(async e => {
      if (!isNewFlow) {
        process.stderr.write(`${MIGRATION_RESULT_PREFIX}${JSON.stringify({ error: e.message })}\n`);
      }
      await DB.disconnect();
      throw e;
    });
};

await (isStatus ? printStatus() : migrate());
