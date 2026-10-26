/** Live per-table progress: rows transferred so far; `done` marks the table's final count. */
type TenantTableProgress = {
  table: string;
  rows: number;
  done: boolean;
  total: number;
};

type TenantProgress = (event: TenantTableProgress) => void;

/** Emit the running count every N rows; the final `done` event always passes through. */
const PROGRESS_EVERY_ROWS = 1000;

export function progressReporter(
  target: { table: string; total: number },
  onProgress: TenantProgress | undefined
): (rows: number, done: boolean) => void {
  if (!onProgress) return () => {};
  let nextEmit = 1;
  return (rows: number, done: boolean) => {
    if (!done && rows < nextEmit) return;
    nextEmit = rows + PROGRESS_EVERY_ROWS;
    onProgress({ table: target.table, rows, done, total: target.total });
  };
}

/**
 * Counts the `\n` bytes in a COPY text chunk, calling `onRow` for each row. COPY escapes embedded
 * newlines as `\n`, so a raw newline byte is exactly one row terminator.
 */
export function countRows(buffer: Buffer, startRow: number, onRow: (rows: number) => void): number {
  let rows = startRow;
  let offset = buffer.indexOf(0x0a);
  while (offset !== -1) {
    rows += 1;
    onRow(rows);
    offset = buffer.indexOf(0x0a, offset + 1);
  }
  return rows;
}

export type { TenantProgress, TenantTableProgress };
