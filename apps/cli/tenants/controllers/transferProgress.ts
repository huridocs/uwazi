import { fstatSync } from 'fs';
import type { Writable } from 'stream';
import type { TenantTableProgress } from '#api/infrastructure/tenant_transfer/PgTenantTransfer.js';

type TransferVerb = 'exporting' | 'importing';

type ProgressWriter = {
  table: (event: TenantTableProgress) => void;
  line: (text: string) => void;
  /** A one-shot step like cleaning: `…` while running, green `✓` once done. */
  task: (label: string, done: boolean) => void;
};

const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const CURSOR_UP = '\x1b[1A';
const CLEAR_LINE = '\x1b[2K';
const CHECK = '✓';

/** process.stderr is a WriteStream (with isTTY); test streams are plain Writables. */
function isTty(stream: Writable): boolean {
  return Boolean((stream as { isTTY?: boolean }).isTTY);
}

/**
 * A pipe means the consumer is another process that may also animate on stderr, so the producer
 * must stay silent. A file redirect (or a terminal) is safe to report on. Test streams carry an
 * explicit `isPipe` marker; real streams are detected from their file descriptor.
 */
function isPipe(stream: Writable): boolean {
  const { isPipe: marker } = stream as { isPipe?: boolean };
  if (marker !== undefined) return marker;
  const { fd } = stream as { fd?: number };
  if (typeof fd !== 'number') return false;
  try {
    return fstatSync(fd).isFIFO();
  } catch {
    return false;
  }
}

function pluralize(rows: number): string {
  return rows === 1 ? 'row' : 'rows';
}

function currentLine(verb: TransferVerb, event: TenantTableProgress): string {
  return `${verb} ${event.table}… ${event.rows} ${pluralize(event.rows)}`;
}

function summaryLine(past: string, completed: number, total: number): string {
  const check = completed === total ? ` ${CHECK}` : '';
  return `tables ${past} ${completed} of ${total}${check}`;
}

/**
 * Renders transfer progress as two stderr lines: a persistent green summary ("tables exported
 * 5 of 15") and, below it, only the table currently streaming. A finished table collapses into
 * the summary and its line is erased. Uses ANSI cursor control on a terminal; when progress is
 * forced on a non-terminal, it falls back to one plain summary line per completed table.
 */
function createProgressWriter(
  stderr: Writable,
  progress: boolean | undefined,
  verb: TransferVerb
): ProgressWriter {
  const enabled = progress ?? isTty(stderr);
  const tty = isTty(stderr);
  const past = verb === 'exporting' ? 'exported' : 'imported';
  let completed = 0;
  let drawn = false;

  const drawTty = (doneCount: number, total: number, current: string): void => {
    const summary = `${GREEN}${summaryLine(past, doneCount, total)}${RESET}`;
    if (drawn) {
      stderr.write(`\r${CURSOR_UP}\r${CLEAR_LINE}${summary}\n\r${CLEAR_LINE}${current}`);
    } else {
      stderr.write(`${summary}\n${current}`);
      drawn = true;
    }
  };

  const table = (event: TenantTableProgress): void => {
    if (!enabled) return;
    if (event.done) completed += 1;
    if (tty) {
      drawTty(completed, event.total, event.done ? '' : currentLine(verb, event));
    } else if (event.done) {
      stderr.write(`${summaryLine(past, completed, event.total)}\n`);
    }
  };

  const line = (text: string): void => {
    if (enabled) stderr.write(`${text}\n`);
  };

  const task = (label: string, done: boolean): void => {
    if (!enabled) return;
    if (done) {
      stderr.write(
        tty ? `\r${CLEAR_LINE}${GREEN}${label} ${CHECK}${RESET}\n` : `${label} ${CHECK}\n`
      );
    } else {
      stderr.write(tty ? `${label}…` : `${label}…\n`);
    }
  };

  return { table, line, task };
}

export { createProgressWriter, isPipe, isTty };
export type { ProgressWriter };
