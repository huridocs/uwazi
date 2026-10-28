import type pg from 'pg';
import type { Executor, StatementListener } from './Executor.js';
import { PipelinedClient, type Message } from './PipelinedClient.js';
import { PostgresSessionContext, type PermissionContext } from './PostgresSessionContext.js';
import { Statements, type Statement, type StatementResult } from './Statement.js';

/**
 * Runs statements outside a transaction. Each call takes a connection and sends BEGIN, the
 * context, the statements and COMMIT without waiting in between: one round trip, then the
 * connection goes back to the pool. Outside a transaction there is nothing to inherit, so an
 * 'inherit' statement runs under the default context.
 */
class AutoCommitExecutor implements Executor {
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
    if (statements.length === 0) return [];
    const { messages, positions } = this.messagesFor(statements);
    const client = await PipelinedClient.connect(this.pool, this.onStatement);
    try {
      const results = await client.sendAll(messages);
      client.release();
      return positions.map(i => results[i]);
    } catch (error) {
      client.release(error);
      throw error;
    }
  }

  async *stream<TRow = Record<string, unknown>>(
    statement: Statement
  ): AsyncGenerator<TRow, void, unknown> {
    const client = await PipelinedClient.connect(this.pool, this.onStatement);
    const opened = [
      client.send('BEGIN'),
      client.send(this.context.statement(AutoCommitExecutor.permissionOf(statement))),
    ];
    PipelinedClient.markHandled(opened);
    const outcome: { committed: boolean; failure?: unknown } = { committed: false };
    try {
      yield* client.stream<TRow>(Statements.toNative(statement));
      outcome.committed = await client.send('COMMIT').then(() => true);
    } catch (error) {
      outcome.failure = await AutoCommitExecutor.firstFailure(opened, error);
      throw outcome.failure;
    } finally {
      await AutoCommitExecutor.finish(client, outcome);
    }
  }

  /** BEGIN, the context, each statement (switching context only when it changes), COMMIT. */
  private messagesFor(statements: Statement[]): { messages: Message[]; positions: number[] } {
    const messages: Message[] = ['BEGIN'];
    const positions: number[] = [];
    let current: PermissionContext | undefined;
    statements.forEach(statement => {
      const permission = AutoCommitExecutor.permissionOf(statement, current);
      if (!current || !PostgresSessionContext.same(current, permission)) {
        messages.push(this.context.statement(permission));
        current = permission;
      }
      positions.push(messages.length);
      messages.push(Statements.toNative(statement));
    });
    messages.push('COMMIT');
    return { messages, positions };
  }

  private static permissionOf(
    statement: Statement,
    current?: PermissionContext
  ): PermissionContext {
    if (statement.permission !== 'inherit')
      return PostgresSessionContext.normalize(statement.permission);
    return current ?? PostgresSessionContext.normalize();
  }

  /** Rolls back a stream that did not commit, and gives its connection back. */
  private static async finish(
    client: PipelinedClient,
    { committed, failure }: { committed: boolean; failure?: unknown }
  ): Promise<void> {
    if (!committed) await client.send('ROLLBACK').catch(() => undefined);
    client.release(failure);
  }

  /** The error that broke the stream, or the BEGIN / context failure it came from. */
  private static async firstFailure(opened: Promise<unknown>[], error: unknown): Promise<unknown> {
    const settled = await Promise.allSettled(opened);
    const rejected = settled.find(s => s.status === 'rejected');
    return rejected ? rejected.reason : error;
  }
}

export { AutoCommitExecutor };
