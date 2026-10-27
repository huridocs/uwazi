import type pg from 'pg';
import QueryStream from 'pg-query-stream';
import type { StatementListener } from './Executor.js';
import type { StatementResult } from './Statement.js';

type Message = string | { text: string; values: unknown[] };

const textOf = (message: Message) => (typeof message === 'string' ? message : message.text);

/**
 * A connection from a `pipeline: true` pool. Each message goes out as soon as it is sent, without
 * waiting for the answers to the ones before it, and Postgres runs them in the order they were
 * sent: several messages sent in a row cost one round trip.
 */
class PipelinedClient {
  constructor(
    private readonly client: pg.PoolClient,
    private readonly onStatement?: StatementListener
  ) {}

  static async connect(pool: pg.Pool, onStatement?: StatementListener): Promise<PipelinedClient> {
    return new PipelinedClient(await pool.connect(), onStatement);
  }

  /** Sends one message now, before returning: messages go out in the order they are sent. */
  async send(message: Message): Promise<StatementResult> {
    this.onStatement?.(textOf(message));
    const { rows, rowCount } = await this.client.query(message);
    return { rows, rowCount: rowCount ?? 0 };
  }

  /** Sends every message in one write; rejects with the first failure, in sending order. */
  async sendAll(messages: Message[]): Promise<StatementResult[]> {
    const settled = await Promise.allSettled(messages.map(async message => this.send(message)));
    const rejected = settled.find((s): s is PromiseRejectedResult => s.status === 'rejected');
    if (rejected) throw rejected.reason;
    return settled.map(s => (s as PromiseFulfilledResult<StatementResult>).value);
  }

  /** For messages nobody awaits (BEGIN, the context): their failure surfaces on later ones. */
  static markHandled(sent: Promise<unknown>[]): void {
    sent.forEach(promise => {
      promise.catch(() => undefined);
    });
  }

  stream<TRow>(message: { text: string; values: unknown[] }): AsyncIterable<TRow> {
    this.onStatement?.(message.text);
    return this.client.query(new QueryStream(message.text, message.values)) as AsyncIterable<TRow>;
  }

  /** Back to the pool; a connection that failed outside Postgres (a dead socket) is discarded. */
  release(error?: unknown): void {
    this.client.release(PipelinedClient.brokeTheConnection(error) ? (error as Error) : undefined);
  }

  /** Errors Postgres reports carry an SQLSTATE `code`; anything else means the socket is unusable. */
  private static brokeTheConnection(error: unknown): boolean {
    return error !== undefined && typeof (error as { code?: unknown })?.code !== 'string';
  }
}

export { PipelinedClient };
export type { Message };
