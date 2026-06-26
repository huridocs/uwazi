/* eslint-disable max-statements */
/* eslint-disable node/no-restricted-import */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tenantId = process.argv[2];
if (!tenantId) {
  console.error('Usage: node pgBlankStateRestore.js <tenant_id>');
  process.exit(1);
}

const pgHost = process.env.POSTGRES_HOST || '127.0.0.1';
const pgPort = parseInt(process.env.POSTGRES_PORT || '5432', 10);
const pgUser = process.env.POSTGRES_USER || 'uwazi';
const pgPassword = process.env.POSTGRES_PASSWORD || 'uwazi';
const pgDb = process.env.POSTGRES_DB || 'uwazi_development';

const dataDir = join(__dirname, 'data');

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
    await client.query('BEGIN');

    const jsonFiles = readdirSync(dataDir).filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const tableName = file.replace('.json', '');
      const filePath = join(dataDir, file);
      const rows = JSON.parse(readFileSync(filePath, 'utf-8'));

      if (!Array.isArray(rows) || rows.length === 0) {
        console.log(`Table ${tableName}: no rows in JSON, skipping.`);
        continue;
      }

      // Get column info to handle JSONB columns
      const columnsResult = await client.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = $1 AND table_schema = 'public'
         ORDER BY ordinal_position`,
        [tableName]
      );

      if (columnsResult.rows.length === 0) {
        console.log(`Table ${tableName} does not exist, skipping.`);
        continue;
      }

      const jsonbColumns = new Set(
        columnsResult.rows
          .filter(r => r.data_type === 'jsonb' || r.data_type === 'json')
          .map(r => r.column_name)
      );

      console.log(`Deleting existing PG data from ${tableName} for tenant: ${tenantId}...`);
      await client.query(`DELETE FROM "${tableName}" WHERE "tenant_id" = $1`, [tenantId]);

      console.log(`Restoring ${rows.length} rows into ${tableName} for tenant: ${tenantId}...`);
      for (const row of rows) {
        const cleanRow = { ...row, tenant_id: tenantId };
        const columns = Object.keys(cleanRow);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = columns.map(col => {
          const val = cleanRow[col];
          if (val === null || val === undefined) return null;
          if (jsonbColumns.has(col)) return JSON.stringify(val);
          return val;
        });

        await client.query(
          `INSERT INTO "${tableName}" ("${columns.join('","')}") VALUES (${placeholders})`,
          values
        );
      }
    }

    await client.query('COMMIT');
    console.log('PostgreSQL data restored successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error restoring PostgreSQL data:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
