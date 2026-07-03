import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
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

  const pgHost = process.env.POSTGRES_HOST || '127.0.0.1';
  const pgPort = parseInt(process.env.POSTGRES_PORT || '5432', 10);
  const pgUser = process.env.POSTGRES_USER || 'uwazi';
  const pgPassword = process.env.POSTGRES_PASSWORD || 'uwazi';
  const pgDb = process.env.POSTGRES_DB || 'uwazi_development';

  const pool = new pg.Pool({
    host: pgHost,
    port: pgPort,
    user: pgUser,
    password: pgPassword,
    database: pgDb,
  });

  try {
    const blankState = new PgBlankState(pool, tenantId, DATA_DIR);
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
    await pool.end();
  }
}

main().catch(err => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
