import type { Statement, StatementResult } from './Statement.js';

/** Hears the SQL of every message an executor sends, transaction control included. */
type StatementListener = (sql: string) => void;

/** The only component that talks to `pg`: it sends Statements and nothing else. */
interface Executor {
  query<TRow = Record<string, unknown>>(statement: Statement): Promise<StatementResult<TRow>>;
  /** Runs the statements in order, in one transaction: all of them take effect or none. */
  queryAll(statements: Statement[]): Promise<StatementResult[]>;
  stream<TRow = Record<string, unknown>>(statement: Statement): AsyncGenerator<TRow, void, unknown>;
}

export type { Executor, StatementListener };
