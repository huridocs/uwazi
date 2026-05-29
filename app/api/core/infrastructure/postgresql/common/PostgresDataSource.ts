import pg from 'pg';
import { Db, ObjectId } from 'mongodb';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { SessionScopedCollection } from '#api/core/infrastructure/mongodb/common/SessionScopedCollection.js';

type BufferedOp = { sql: string; params: unknown[] };

/**
 * Base class for PostgreSQL data sources in the V2 core.
 *
 * Session management:
 *   - A PoolClient is checked out when the first buffered write is flushed (onCommitted).
 *   - All buffered write operations execute inside a single PG BEGIN/COMMIT block,
 *     which runs *after* the MongoDB transaction commits (via MongoTransactionManager.onCommitted).
 *   - On MongoTransactionManager retry the buffer is cleared.
 *
 * Sync:
 *   - After each PG write, a sync record is inserted into the MongoDB `updatelogs` collection
 *     (same mechanism as SyncedCollection) so the existing sync infrastructure keeps working
 *     during the migration period.
 */
export abstract class PostgresDataSource {
  protected pool: pg.Pool;

  protected transactionManager: MongoTransactionManager;

  private mongoDb: Db;

  private buffer: BufferedOp[] = [];

  private syncNamespace: string;

  constructor(deps: {
    pool: pg.Pool;
    transactionManager: MongoTransactionManager;
    mongoDb: Db;
    syncNamespace: string;
  }) {
    this.pool = deps.pool;
    this.transactionManager = deps.transactionManager;
    this.mongoDb = deps.mongoDb;
    this.syncNamespace = deps.syncNamespace;

    this.transactionManager.onCommitted(async () => {
      await this.flushBuffer();
    });

    this.transactionManager.onRetry(async () => {
      this.buffer = [];
    });
  }

  /**
   * Execute a read-only query directly against the pool (no buffering).
   */
  protected async query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    sql: string,
    params: unknown[] = []
  ): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(sql, params);
  }

  /**
   * Buffer a write operation to be executed inside a PG transaction after Mongo commits.
   */
  protected bufferWrite(sql: string, params: unknown[] = []): void {
    this.buffer.push({ sql, params });
  }

  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) return;

    const ops = [...this.buffer];
    this.buffer = [];

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const op of ops) {
        // eslint-disable-next-line no-await-in-loop
        await client.query(op.sql, op.params as any[]);
      }
      await client.query('COMMIT');
      await this.writeSyncLogs(client, ops);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Write sync records to MongoDB updatelogs after a successful PG commit.
   * This keeps the existing sync mechanism working during the migration.
   */
  private async writeSyncLogs(client: pg.PoolClient, ops: BufferedOp[]): Promise<void> {
    if (ops.length === 0) return;

    const updateLogsCollection = new SessionScopedCollection(
      this.mongoDb.collection('updatelogs'),
      this.transactionManager
    );

    await updateLogsCollection.insertMany(
      ops.map(() => ({
        _id: new ObjectId(),
        timestamp: Date.now(),
        namespace: this.syncNamespace,
        mongoId: new ObjectId(),
        deleted: false,
      }))
    );
  }
}
