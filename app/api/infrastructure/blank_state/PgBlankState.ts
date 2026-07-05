// eslint-disable-next-line node/no-restricted-import
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import pg from 'pg';

function escapeIdentifier(identifier: string): string {
  return identifier.replace(/"/g, '""');
}

export class TenantDataExistsError extends Error {
  constructor(tenantId: string) {
    super(`PostgreSQL data for tenant '${tenantId}' already exists.`);
    this.name = 'TenantDataExistsError';
  }
}

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
          await client.query(`DELETE FROM "${escapeIdentifier(table)}" WHERE tenant_id = $1`, [this.tenantId]);
        }
        /* eslint-enable no-await-in-loop */
      }
      await this.restoreFixtures(client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
  /** Restores fixture JSON files for this tenant. */
  private async restoreFixtures(client: pg.PoolClient): Promise<void> {
    const jsonFiles = readdirSync(this.dataDir).filter(f => f.endsWith('.json'));

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
        const values = columns.map(col => {
          const val = cleanRow[col];
          if (val === null || val === undefined) return null;
          if (jsonbColumns.has(col)) return JSON.stringify(val);
          return val;
        });

        const escapedColumns = columns.map(col => `"${escapeIdentifier(col)}"`).join(', ');
        await client.query(
          `INSERT INTO "${escapeIdentifier(tableName)}" (${escapedColumns}) VALUES (${placeholders})`,
          values
        );
      }
    }
  }
  /* eslint-enable no-await-in-loop, no-continue */
}
