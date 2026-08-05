/* eslint-disable max-statements */
import path from 'path';
import { fileURLToPath } from 'url';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PgBlankState, TenantDataExistsError } from './PgBlankState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');

async function main() {
  const args = process.argv.slice(2);
  const tenantId = args.find(arg => !arg.startsWith('--'));
  const force = args.includes('--force');

  if (!tenantId) {
    process.stderr.write('Usage: runPgBlankState.ts <tenant_id> [--force]\n');
    process.exit(1);
  }

  try {
    const blankState = new PgBlankState(PostgresDB.adminPool(), tenantId, DATA_DIR);
    await blankState.run({ force });
    process.stdout.write('PostgreSQL blank state completed successfully.\n');
  } catch (error) {
    if (error instanceof TenantDataExistsError) {
      process.stderr.write(`Error: ${error.message} Use --force to override.\n`);
      process.exit(2);
    }
    process.stderr.write(`Error: ${(error as Error).message}\n`);
    process.exit(1);
  } finally {
    await PostgresDB.disconnect();
  }
}

main().catch(err => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
