// eslint-disable-next-line no-restricted-imports
import { readdirSync, readFileSync } from 'fs';
// eslint-disable-next-line no-restricted-imports
import { writeFile } from 'fs/promises';
import path from 'path';
import pg from 'pg';
import { serializePgValue } from '#api/core/infrastructure/postgresql/serializePgValue.js';
import { BlankStateEmptyError } from './BlankStateEmptyError.js';
import { BlankStateTablesMissingError } from './BlankStateTablesMissingError.js';
import { TenantDataExistsError } from './TenantDataExistsError.js';

function escapeIdentifier(identifier: string): string {
  return identifier.replace(/"/g, '""');
}

function stripTenantId(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'tenant_id'));
}

/** Tenant tables that constitute a blank state. History and user-data tables are excluded. */
const BLANK_STATE_TABLES = new Set([
  'settings',
  'templates',
  'thesauri',
  'relationship_types',
  'users',
  'usergroups',
  'translations',
  'pages',
  'page_locales',
  'page_releases',
]);

export class PgBlankState {
  constructor(
    private pool: pg.Pool,
    private tenantId: string,
    private dataDir: string
  ) {}

  /** Full blank state: delete existing tenant data, then restore fixtures. Atomic. */
  async run(options: { force?: boolean } = {}): Promise<void> {
    const tables = await this.getTenantTables();
    const exists = await this.tenantDataExists(tables);

    if (exists && !options.force) {
      throw new TenantDataExistsError(this.tenantId);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (exists) {
        /* eslint-disable no-await-in-loop */
        for (const table of tables) {
          await client.query(`DELETE FROM "${escapeIdentifier(table)}" WHERE tenant_id = $1`, [
            this.tenantId,
          ]);
        }
        /* eslint-enable no-await-in-loop */
      }
      const { restored, missingTables } = await this.restoreFixtures(client);
      if (missingTables.length > 0) {
        throw new BlankStateTablesMissingError(missingTables);
      }
      if (restored.length === 0) {
        throw new BlankStateEmptyError();
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** Dumps this tenant's current rows to fixture files. Empty tables are skipped. */
  async dump(): Promise<string[]> {
    const tables = (await this.getTenantTables()).filter(t => BLANK_STATE_TABLES.has(t));
    const written: string[] = [];

    await Promise.all(
      tables.map(async table => {
        const result = await this.pool.query<{ row: Record<string, unknown> }>(
          `SELECT row_to_json(t) AS row FROM "${escapeIdentifier(table)}" t WHERE tenant_id = $1`,
          [this.tenantId]
        );
        if (result.rows.length === 0) return;

        const rows = result.rows
          .map(({ row }) => stripTenantId(row))
          .sort(
            (a, b) =>
              String(a._id ?? '').localeCompare(String(b._id ?? '')) ||
              JSON.stringify(a).localeCompare(JSON.stringify(b))
          );

        await writeFile(
          path.join(this.dataDir, `${table}.json`),
          `${JSON.stringify(rows, null, 2)}\n`
        );
        written.push(table);
      })
    );

    return written.sort();
  }

  /** Returns all public tables that have a tenant_id column, excluding pg_migrations. */
  private async getTenantTables(): Promise<string[]> {
    const result = await this.pool.query<{ table_name: string }>(`
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'tenant_id'
        AND table_name <> 'pg_migrations'
      ORDER BY table_name
    `);
    return result.rows.map(r => r.table_name);
  }

  /* eslint-disable no-await-in-loop */
  /** Checks whether any tenant-scoped table contains data for this tenant. */
  private async tenantDataExists(tables: string[]): Promise<boolean> {
    for (const table of tables) {
      const result = await this.pool.query<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT 1 FROM "${escapeIdentifier(table)}" WHERE tenant_id = $1 LIMIT 1
        )`,
        [this.tenantId]
      );
      if (result.rows[0].exists) {
        return true;
      }
    }
    return false;
  }
  /* eslint-enable no-await-in-loop */

  /* eslint-disable no-await-in-loop, no-continue */
  /**
   * Restores fixture JSON files for this tenant, returning the tables that had rows inserted and
   * the fixture tables that do not exist in the schema.
   */
  private async restoreFixtures(
    client: pg.PoolClient
  ): Promise<{ restored: string[]; missingTables: string[] }> {
    const jsonFiles = readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    const restored: string[] = [];
    const missingTables: string[] = [];

    for (const file of jsonFiles) {
      const tableName = file.replace('.json', '');
      const filePath = path.join(this.dataDir, file);
      const rows = JSON.parse(readFileSync(filePath, 'utf-8'));

      if (!Array.isArray(rows) || rows.length === 0) {
        continue;
      }

      const columnsResult = await client.query<{ column_name: string; data_type: string }>(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = $1 AND table_schema = 'public'
         ORDER BY ordinal_position`,
        [tableName]
      );

      if (columnsResult.rows.length === 0) {
        missingTables.push(tableName);
        continue;
      }

      const jsonbColumns = new Set(
        columnsResult.rows
          .filter(r => r.data_type === 'jsonb' || r.data_type === 'json')
          .map(r => r.column_name)
      );

      for (const row of rows) {
        const cleanRow = { ...row, tenant_id: this.tenantId };
        const columns = Object.keys(cleanRow);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = columns.map(col => serializePgValue(cleanRow[col], jsonbColumns.has(col)));

        const escapedColumns = columns.map(col => `"${escapeIdentifier(col)}"`).join(', ');
        await client.query(
          `INSERT INTO "${escapeIdentifier(tableName)}" (${escapedColumns}) VALUES (${placeholders})`,
          values
        );
      }
      restored.push(tableName);
    }

    return { restored, missingTables };
  }
  /* eslint-enable no-await-in-loop, no-continue */
}
