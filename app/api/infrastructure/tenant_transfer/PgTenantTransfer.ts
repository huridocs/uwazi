import { once } from 'events';
import { finished } from 'stream/promises';
import type { Readable, Writable } from 'stream';
import type pg from 'pg';
import { from as copyFrom, to as copyTo } from 'pg-copy-streams';
import { PrematureEndOfStreamError } from './PrematureEndOfStreamError.js';
import { UnknownTableInManifestError } from './UnknownTableInManifestError.js';
import { parseManifest, rewriteTenantId, serializeManifest } from './manifest.js';
import type { ExportManifest } from './manifest.js';
import {
  discoverDataTablesWithColumns,
  discoverTenantTables,
  type TableWithColumns,
} from './tenantTableDiscovery.js';
import { countRows, progressReporter } from './progress.js';
import type { TenantProgress } from './progress.js';

/**
 * Framing marker between COPY sections. COPY TO STDOUT sends raw row data over the protocol with
 * no end marker, so export writes `\.` after each table's stream; import stops a section there.
 * A data row always carries a tab (tenant_id + at least one column), so a bare `\.` is unambiguous.
 */
const COPY_END_MARKER = '\\.';

/**
 * Rows are buffered up to this size before one write to the COPY stream. pg-copy-streams turns
 * each `write()` into one CopyData protocol message plus one socket write, so writing row-by-row
 * costs a message per row; batching amortises that to a handful of large messages per table.
 */
const WRITE_BATCH_BYTES = 1024 * 1024;

function escapeIdentifier(identifier: string): string {
  return identifier.replace(/"/g, '""');
}

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

function copyInSql(table: TableWithColumns): string {
  const columns = table.columns.map(column => `"${escapeIdentifier(column)}"`).join(', ');
  return `COPY "${escapeIdentifier(table.name)}" (${columns}) FROM STDIN`;
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

function assertKnownTables(manifest: ExportManifest, knownTables: Set<string>): void {
  const unknown = manifest.tables.find(table => !knownTables.has(table.name));
  if (unknown) throw new UnknownTableInManifestError(unknown.name);
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

function abortCopy(stream: Writable, table: string): PrematureEndOfStreamError {
  stream.destroy();
  return new PrematureEndOfStreamError(table);
}

async function flushBatch(stream: Writable, batch: string): Promise<void> {
  if (batch && !stream.write(batch)) await once(stream, 'drain');
}

async function accumulate(stream: Writable, batch: string, row: string): Promise<string> {
  const next = `${batch}${row}\n`;
  if (next.length < WRITE_BATCH_BYTES) return next;
  await flushBatch(stream, next);
  return '';
}

async function writeRows(
  lines: AsyncIterableIterator<string>,
  stream: Writable,
  target: { table: string; tenantId: string; onRow?: (rows: number) => void }
): Promise<void> {
  let batch = '';
  let rows = 0;
  /* eslint-disable no-await-in-loop */
  for (;;) {
    const { value, done } = await lines.next();
    if (done) throw abortCopy(stream, target.table);
    if (value === COPY_END_MARKER) break;
    batch = await accumulate(stream, batch, rewriteTenantId(value, target.tenantId));
    rows += 1;
    target.onRow?.(rows);
  }
  /* eslint-enable no-await-in-loop */
  await flushBatch(stream, batch);
}

async function loadTable(
  client: pg.PoolClient,
  lines: AsyncIterableIterator<string>,
  target: {
    table: TableWithColumns;
    tenantId: string;
    report: (rows: number, done: boolean) => void;
  }
): Promise<number> {
  const stream = client.query(copyFrom(copyInSql(target.table)));
  // Aborting a COPY mid-stream makes the server reply with an ErrorResponse; this no-op listener
  // stops that from becoming an unhandled 'error' when the stream is destroyed on the way out.
  stream.on('error', () => {});
  await writeRows(lines, stream, {
    table: target.table.name,
    tenantId: target.tenantId,
    onRow: rows => target.report(rows, false),
  });
  stream.end();
  await finished(stream);
  target.report(stream.rowCount, true);
  return stream.rowCount;
}

async function sanitizeSettings(
  client: pg.PoolClient,
  manifest: ExportManifest,
  tenantId: string
): Promise<void> {
  if (manifest.tables.some(table => table.name === 'settings')) {
    await client.query(`UPDATE "settings" SET "sync" = NULL WHERE "tenant_id" = $1`, [tenantId]);
  }
}

/**
 * Tenant data transfer over the admin/migrator pool (RLS-bypassing): export one tenant to a
 * portable COPY stream, import such a stream into another tenant, or clean a tenant's rows.
 */
export class PgTenantTransfer {
  constructor(private readonly pool: pg.Pool) {}

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
    output.write(`${serializeManifest(tenantId, tables)}\n`);
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
   * Reads an export stream from `input` and loads it into `tenantId`, rewriting every row's
   * tenant_id to the destination and clearing `settings.sync`. All-or-nothing: a failing table
   * rolls back the whole import.
   */
  async import(
    tenantId: string,
    input: Readable,
    onProgress?: TenantProgress
  ): Promise<{ sourceTenant: string; tables: string[]; rows: number }> {
    const knownTables = new Set(await discoverTenantTables(this.pool));
    try {
      const lines = readLines(input);
      const manifest = await readManifest(lines);
      assertKnownTables(manifest, knownTables);
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
        await sanitizeSettings(client, manifest, tenantId);
        return total;
      });
      return {
        sourceTenant: manifest.sourceTenant,
        tables: manifest.tables.map(t => t.name),
        rows,
      };
    } finally {
      input.destroy();
    }
  }
}

export type { TenantProgress, TenantTableProgress } from './progress.js';
