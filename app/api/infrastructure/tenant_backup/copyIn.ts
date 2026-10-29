import { once } from 'events';
import { finished } from 'stream/promises';
import type { Writable } from 'stream';
import type pg from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import { PrematureEndOfStreamError } from './PrematureEndOfStreamError.js';
import { rowRewriter } from './importSteps.js';
import type { TableWithColumns } from './tenantTableDiscovery.js';

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

function copyInSql(table: TableWithColumns): string {
  const columns = table.columns.map(column => `"${escapeIdentifier(column)}"`).join(', ');
  return `COPY "${escapeIdentifier(table.name)}" (${columns}) FROM STDIN`;
}

function abortCopy(stream: Writable, table: string): PrematureEndOfStreamError {
  stream.destroy();
  return new PrematureEndOfStreamError(table);
}

/** The COPY target and the error pg-copy-streams reports once it aborts the COPY. */
type CopySink = {
  stream: Writable;
  failed: () => unknown;
};

type RowTarget = {
  table: string;
  rewrite: (line: string) => string;
  onRow?: (rows: number) => void;
};

async function flushBatch(sink: CopySink, batch: string): Promise<void> {
  if (!batch) return;
  const failure = sink.failed();
  if (failure) throw failure;
  if (!sink.stream.write(batch)) await once(sink.stream, 'drain');
}

async function accumulate(sink: CopySink, batch: string, row: string): Promise<string> {
  const next = `${batch}${row}\n`;
  if (next.length < WRITE_BATCH_BYTES) return next;
  await flushBatch(sink, next);
  return '';
}

async function writeRows(
  lines: AsyncIterableIterator<string>,
  sink: CopySink,
  target: RowTarget
): Promise<void> {
  let batch = '';
  let rows = 0;
  /* eslint-disable no-await-in-loop */
  for (;;) {
    const { value, done } = await lines.next();
    if (done) throw abortCopy(sink.stream, target.table);
    if (value === COPY_END_MARKER) break;
    batch = await accumulate(sink, batch, target.rewrite(value));
    rows += 1;
    target.onRow?.(rows);
  }
  /* eslint-enable no-await-in-loop */
  await flushBatch(sink, batch);
}

/** Runs the COPY, stopping on failure and surfacing the real Postgres error. */
async function pumpTable(
  lines: AsyncIterableIterator<string>,
  sink: CopySink,
  target: RowTarget
): Promise<void> {
  try {
    await writeRows(lines, sink, target);
    sink.stream.end();
    await finished(sink.stream);
  } catch (error) {
    if (error instanceof PrematureEndOfStreamError) throw error;
    throw sink.failed() ?? error;
  }
}

export type LoadTableTarget = {
  table: TableWithColumns;
  tenantId: string;
  report: (rows: number, done: boolean) => void;
};

/**
 * Loads one table's COPY section into `target.tenantId`, rewriting each row's tenant_id. The
 * stream's 'error' is captured (not swallowed) so the write loop can stop and rethrow it instead
 * of dereferencing the nulled connection on the next write.
 */
export async function loadTable(
  client: pg.PoolClient,
  lines: AsyncIterableIterator<string>,
  target: LoadTableTarget
): Promise<number> {
  const stream = client.query(copyFrom(copyInSql(target.table)));
  let failure: unknown;
  stream.on('error', (error: Error) => {
    failure = error;
  });
  const sink: CopySink = { stream, failed: () => failure };
  await pumpTable(lines, sink, {
    table: target.table.name,
    rewrite: rowRewriter(target.table, target.tenantId),
    onRow: rows => target.report(rows, false),
  });
  target.report(stream.rowCount, true);
  return stream.rowCount;
}

export { COPY_END_MARKER, escapeIdentifier };
