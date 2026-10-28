import type pg from 'pg';
import type { Executor, StatementListener } from './Executor.js';
import { PipelinedClient } from './PipelinedClient.js';
import { PostgresSessionContext, type PermissionContext } from './PostgresSessionContext.js';
import { Statements, type Statement, type StatementResult } from './Statement.js';
import { TransactionUnavailableError } from './TransactionUnavailableError.js';

/**
 * One transaction on one connection. Nothing is sent until the first statement: it takes the
 * connection and goes out together with BEGIN and the context. Later statements resend the context
 * only when their permission differs from the last one sent, in the same write. Statements go out
 * in the order they are given, so statements sent concurrently pipeline into one round trip.
 *
 * Once a statement fails Postgres rejects the rest of the transaction; every later statement, and
 * commit(), throws that first error instead of "current transaction is aborted".
 */
class TransactionExecutor implements Executor {
  private connection?: Promise<PipelinedClient>;

  private sentPermission?: PermissionContext;

  private firstError?: unknown;

  private closed = false;

  private streaming = false;

  constructor(
    private readonly pool: pg.Pool,
    private readonly context: PostgresSessionContext,
    private readonly onStatement?: StatementListener
  ) {}

  async query<TRow = Record<string, unknown>>(
    statement: Statement
  ): Promise<StatementResult<TRow>> {
    const [result] = await this.queryAll([statement]);
    return result as StatementResult<TRow>;
  }

  async queryAll(statements: Statement[]): Promise<StatementResult[]> {
    const client = await this.openClient();
    return Promise.all(statements.map(async statement => this.send(client, statement)));
  }

  async *stream<TRow = Record<string, unknown>>(
    statement: Statement
  ): AsyncGenerator<TRow, void, unknown> {
    const client = await this.openClient();
    this.switchContext(client, statement);
    this.streaming = true;
    try {
      for await (const row of client.stream<TRow>(Statements.toNative(statement))) {
        yield row;
      }
    } catch (error) {
      this.firstError ??= error;
      throw this.firstError;
    } finally {
      this.streaming = false;
    }
  }

  async commit(): Promise<void> {
    if (this.closed) throw TransactionUnavailableError.closed();
    this.closed = true;
    if (!this.connection) return;
    const client = await this.connection;
    try {
      await this.commitOn(client);
    } catch (error) {
      await client.send('ROLLBACK').catch(() => undefined);
      client.release(error);
      throw error;
    }
    client.release();
  }

  /** COMMIT, unless a statement failed: then, or when one fails before COMMIT is answered, throws. */
  private async commitOn(client: PipelinedClient): Promise<void> {
    if (this.firstError) throw this.firstError;
    await this.send(client, 'COMMIT');
    if (this.firstError) throw this.firstError;
  }

  async rollback(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    if (!this.connection) return;
    const client = await this.connection;
    const rolledBack = await client.send('ROLLBACK').then(
      () => undefined,
      (error: unknown) => error
    );
    client.release(rolledBack ?? this.firstError);
  }

  /** The connection, taken and opened with BEGIN on the first call. */
  private async openClient(): Promise<PipelinedClient> {
    if (this.closed) throw TransactionUnavailableError.closed();
    if (this.streaming) throw TransactionUnavailableError.streaming();
    this.connection ??= PipelinedClient.connect(this.pool, this.onStatement).then(client => {
      client.send('BEGIN').catch(error => this.recordError(error));
      return client;
    });
    const client = await this.connection;
    if (this.closed) throw TransactionUnavailableError.closed();
    if (this.streaming) throw TransactionUnavailableError.streaming();
    return client;
  }

  private async send(
    client: PipelinedClient,
    message: Statement | 'COMMIT'
  ): Promise<StatementResult> {
    if (message !== 'COMMIT') this.switchContext(client, message);
    const native = message === 'COMMIT' ? message : Statements.toNative(message);
    return client.send(native).catch(error => {
      throw this.recordError(error);
    });
  }

  /** Queues the context ahead of the statement when its permission is not the one last sent. */
  private switchContext(client: PipelinedClient, statement: Statement): void {
    if (statement.permission === 'inherit' && this.sentPermission) return;
    const permission =
      statement.permission === 'inherit'
        ? PostgresSessionContext.normalize()
        : PostgresSessionContext.normalize(statement.permission);
    if (this.sentPermission && PostgresSessionContext.same(this.sentPermission, permission)) return;
    this.sentPermission = permission;
    client.send(this.context.statement(permission)).catch(error => this.recordError(error));
  }

  private recordError(error: unknown): unknown {
    this.firstError ??= error;
    return this.firstError;
  }
}

export { TransactionExecutor };
