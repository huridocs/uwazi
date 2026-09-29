import type { Writable } from 'stream';
import type { ErrorPayload } from '../contracts/ErrorPayload.js';

type PresenterOptions = {
  json: boolean;
  verbose: boolean;
  stdout?: Writable;
  stderr?: Writable;
};

const COLUMN_GAP = '  ';

/**
 * The only writer of command output. Results go to stdout, errors to stderr, so a caller can
 * parse stdout without filtering anything out.
 */
class Presenter {
  private readonly json: boolean;

  private readonly verbose: boolean;

  private readonly stdout: Writable;

  private readonly stderr: Writable;

  constructor({
    json,
    verbose,
    stdout = process.stdout,
    stderr = process.stderr,
  }: PresenterOptions) {
    this.json = json;
    this.verbose = verbose;
    this.stdout = stdout;
    this.stderr = stderr;
  }

  result(value: unknown): void {
    if (this.json) {
      this.stdout.write(`${JSON.stringify(value)}\n`);
      return;
    }

    this.stdout.write(Presenter.human(value));
  }

  error(payload: ErrorPayload, original: unknown): void {
    if (this.json) {
      this.stderr.write(`${JSON.stringify(payload)}\n`);
    } else {
      const { message, code, validation = [] } = payload.error;
      const lines = [
        `error: ${message} [${code}]`,
        ...validation.map(issue => `  ${issue.field}: ${issue.message}`),
      ];
      this.stderr.write(`${lines.join('\n')}\n`);
    }

    if (this.verbose && original instanceof Error && original.stack) {
      this.stderr.write(`${original.stack}\n`);
    }
  }

  private static human(value: unknown): string {
    if (value === undefined) return '';

    if (Array.isArray(value)) {
      return value.every(Presenter.isRecord)
        ? Presenter.table(value)
        : Presenter.lines(value.map(Presenter.cell));
    }

    if (Presenter.isRecord(value)) {
      return Presenter.lines(Object.entries(value).map(([k, v]) => `${k}: ${Presenter.cell(v)}`));
    }

    return Presenter.lines([Presenter.cell(value)]);
  }

  private static table(rows: Record<string, unknown>[]): string {
    if (!rows.length) return '';

    const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];
    const cells = rows.map(row => columns.map(column => Presenter.cell(row[column])));
    const widths = columns.map((column, i) =>
      Math.max(column.length, ...cells.map(row => row[i].length))
    );

    const format = (row: string[]) =>
      row
        .map((cell, i) => (i === row.length - 1 ? cell : cell.padEnd(widths[i])))
        .join(COLUMN_GAP)
        .trimEnd();

    return Presenter.lines([format(columns), ...cells.map(format)]);
  }

  private static cell(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private static lines(lines: string[]): string {
    return lines.length ? `${lines.join('\n')}\n` : '';
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

export { Presenter };
export type { PresenterOptions };
