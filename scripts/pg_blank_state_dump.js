/* eslint-disable max-statements */
/* eslint-disable node/no-restricted-import */
/* eslint-disable no-await-in-loop */
import { readdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tenantId = process.argv[2];

if (!tenantId) {
  console.error('Usage: node pg_blank_state_dump.js <tenant_id>');
  process.exit(1);
}

const pgHost = process.env.POSTGRES_HOST || '127.0.0.1';
const pgPort = parseInt(process.env.POSTGRES_PORT || '5432', 10);
const pgUser = process.env.POSTGRES_USER || 'uwazi';
const pgPassword = process.env.POSTGRES_PASSWORD || 'uwazi';
const pgDb = process.env.POSTGRES_DB || 'uwazi_development';

const dataDir = join(__dirname, '..', 'database', 'blank_state', 'pg_data');

async function main() {
  const client = new Client({
    host: pgHost,
    port: pgPort,
    user: pgUser,
    password: pgPassword,
    database: pgDb,
  });

  await client.connect();

  try {
    const jsonFiles = readdirSync(dataDir).filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const tableName = file.replace('.json', '');

      const result = await client.query(`SELECT * FROM "${tableName}" WHERE "tenant_id" = $1`, [
        tenantId,
      ]);

      const rows = result.rows.map(row => {
        const clean = { ...row };
        clean.tenant_id = '__TENANT_ID__';
        return clean;
      });

      const outputPath = join(dataDir, file);
      writeFileSync(outputPath, JSON.stringify(rows, null, 2) + '\n');
      console.log(`Dumped ${rows.length} rows from ${tableName} to ${outputPath}`);
    }
  } catch (err) {
    console.error('Error dumping PostgreSQL data:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
