import { finished } from 'stream/promises';
import type { Readable, Writable } from 'stream';
import type pg from 'pg';
import { to as copyTo } from 'pg-copy-streams';
import { PrematureEndOfStreamError } from './PrematureEndOfStreamError.js';
import { TenantAlreadyHasDataError } from './TenantAlreadyHasDataError.js';
import { COPY_END_MARKER, escapeIdentifier, loadTable } from './copyIn.js';
import { parseManifest, serializeManifest } from './manifest.js';
import type { ExportManifest } from './manifest.js';
import { validateManifest } from './manifestValidation.js';
import { nullSyncConfig, reconcileJobs } from './importSteps.js';
import { readSchemaVersion } from './schemaVersion.js';
import {
  discoverDataTablesWithColumns,
  discoverTenantTables,
  type TableWithColumns,
} from './tenantTableDiscovery.js';
import { countRows, progressReporter } from './progress.js';
import type { TenantProgress } from './progress.js';

function escapeLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function copyOutSql(table: TableWithColumns, tenantId: string): string {
  const columns = table.columns.map(column => `"${escapeIdentifier(column)}"`).join(', ');
  return (
    `COPY (SELECT ${columns} FROM "${escapeIdentifier(table.name)}" ` +
    `WHERE "tenant_id" = ${escapeLiteral(tenantId)}) TO STDOUT`
  );
}

async function withTransaction<T>(
  pool: pg.Pool,
  begin: string,
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(begin);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteTableRows(
  client: pg.PoolClient,
  table: string,
  tenantId: string
): Promise<number> {
  const result = await client.query(
    `DELETE FROM "${escapeIdentifier(table)}" WHERE "tenant_id" = $1`,
    [tenantId]
  );
  return result.rowCount ?? 0;
}

async function copyTableOut(
  client: pg.PoolClient,
  target: { table: TableWithColumns; tenantId: string; output: Writable },
  report: (rows: number, done: boolean) => void
): Promise<number> {
  const stream = client.query(copyTo(copyOutSql(target.table, target.tenantId)));
  let rows = 0;
  stream.on('data', (chunk: Buffer) => {
    rows = countRows(chunk, rows, count => report(count, false));
  });
  stream.pipe(target.output, { end: false });
  await finished(stream);
  target.output.write(`${COPY_END_MARKER}\n`);
  report(stream.rowCount, true);
  return stream.rowCount;
}

async function readManifest(lines: AsyncIterableIterator<string>): Promise<ExportManifest> {
  const first = await lines.next();
  if (first.done) throw new PrematureEndOfStreamError('<manifest>');
  return parseManifest(first.value);
}

/**
 * Yields the input line-by-line without readline's per-line microtask: chunks are split eagerly
 * so all complete lines of a chunk are yielded synchronously. Safe for COPY text because data
 * never contains a raw newline (Postgres escapes it as `\n`).
 */
async function* readLines(input: AsyncIterable<string | Buffer>): AsyncGenerator<string> {
  let pending = '';
  for await (const chunk of input) {
    pending += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    yield* lines;
  }
  if (pending) yield pending;
}

/** Runs `fn` and destroys `input` on the way out, success or failure. */
async function withDestroyedInput<T>(input: Readable, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } finally {
    input.destroy();
  }
}

/**
 * Tenant backup/restore over the admin/migrator pool (RLS-bypassing): export one tenant to a
 * portable COPY stream, import such a stream into another tenant, or clean a tenant's rows.
 */
type ImportOptions = {
  onProgress?: TenantProgress;
  /** When true, clears settings.sync: a cross-tenant restore must not inherit the source's sync config. */
  nullSync?: boolean;
};

export class PgTenantBackup {
  constructor(
    private readonly pool: pg.Pool,
    /** Overrides the pg_migrations read; lets specs pin a schema version without touching it. */
    private readonly getSchemaVersion?: () => Promise<number>
  ) {}

  private async currentSchemaVersion(): Promise<number> {
    return this.getSchemaVersion ? this.getSchemaVersion() : readSchemaVersion(this.pool);
  }

  /**
   * Deletes every row of a tenant across all tenant-scoped tables (in-flight tables included),
   * leaving the registry row untouched. Idempotent: a second run deletes 0 rows.
   */
  async clean(tenantId: string): Promise<{ tables: string[]; deletedRows: number }> {
    const tables = await discoverTenantTables(this.pool);
    // Children before parents: ix_models/ix_suggestions reference ix_extractors, so deleting them
    // first keeps the row count accurate (a cascade-deleted row is not counted by its parent).
    const deleteOrder = [...tables].reverse();
    const deletedRows = await withTransaction(this.pool, 'BEGIN', async client => {
      let total = 0;
      /* eslint-disable no-await-in-loop */
      for (const table of deleteOrder) {
        total += await deleteTableRows(client, table, tenantId);
      }
      /* eslint-enable no-await-in-loop */
      return total;
    });
    return { tables, deletedRows };
  }

  /**
   * Streams a tenant's data tables to `output` as one portable stream: a manifest line, then one
   * COPY text section per table. Snapshot-consistent within a REPEATABLE READ transaction.
   */
  async export(tenantId: string, output: Writable, onProgress?: TenantProgress): Promise<string[]> {
    const tables = await discoverDataTablesWithColumns(this.pool);
    const schemaVersion = await this.currentSchemaVersion();
    output.write(`${serializeManifest(tenantId, schemaVersion, tables)}\n`);
    await withTransaction(this.pool, 'BEGIN ISOLATION LEVEL REPEATABLE READ', async client => {
      /* eslint-disable no-await-in-loop */
      for (const table of tables) {
        const report = progressReporter({ table: table.name, total: tables.length }, onProgress);
        await copyTableOut(client, { table, tenantId, output }, report);
      }
      /* eslint-enable no-await-in-loop */
    });
    return tables.map(table => table.name);
  }

  /**
   * A restore targets an empty tenant; refuse a destination that already holds rows so a
   * duplicate-key COPY failure never masquerades as an internal error mid-import.
   */
  private async assertEmpty(tenantId: string): Promise<void> {
    const tables = await discoverTenantTables(this.pool);
    /* eslint-disable no-await-in-loop */
    for (const table of tables) {
      const result = await this.pool.query(
        `SELECT 1 FROM "${escapeIdentifier(table)}" WHERE "tenant_id" = $1 LIMIT 1`,
        [tenantId]
      );
      if (result.rows.length > 0) throw new TenantAlreadyHasDataError(tenantId);
    }
    /* eslint-enable no-await-in-loop */
  }

  /**
   * Reads an export stream from `input` and loads it into `tenantId`, rewriting every row's
   * tenant_id to the destination and reconciling jobs' namespace to it. `settings.sync` is
   * preserved unless `nullSync` is set. All-or-nothing: a failing table rolls back the whole
   * import.
   */
  async import(
    tenantId: string,
    input: Readable,
    options: ImportOptions = {}
  ): Promise<{ sourceTenant: string; tables: string[]; rows: number }> {
    const { onProgress, nullSync = false } = options;
    const dataTables = await discoverDataTablesWithColumns(this.pool);
    const columnsByTable = new Map(dataTables.map(table => [table.name, table.columns]));
    return withDestroyedInput(input, async () => {
      const lines = readLines(input);
      const manifest = await readManifest(lines);
      await validateManifest(manifest, columnsByTable, async () => this.currentSchemaVersion());
      await this.assertEmpty(tenantId);
      const rows = await withTransaction(this.pool, 'BEGIN', async client => {
        let total = 0;
        /* eslint-disable no-await-in-loop */
        for (const table of manifest.tables) {
          const report = progressReporter(
            { table: table.name, total: manifest.tables.length },
            onProgress
          );
          total += await loadTable(client, lines, { table, tenantId, report });
        }
        /* eslint-enable no-await-in-loop */
        await reconcileJobs(client, manifest, tenantId);
        if (nullSync) {
          await nullSyncConfig(client, manifest, tenantId);
        }
        return total;
      });
      return {
        sourceTenant: manifest.sourceTenant,
        tables: manifest.tables.map(t => t.name),
        rows,
      };
    });
  }
}

export type { TenantProgress, TenantTableProgress } from './progress.js';
