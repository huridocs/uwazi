import pg from 'pg';
import { Db, ObjectId } from 'mongodb';

/**
 * Base class for PostgreSQL data sources in the V2 core.
 *
 * Design:
 *   - All reads and writes go directly to the pool (no buffering, no deferred flush).
 *   - After each write, a sync record is inserted into MongoDB `updatelogs` so that
 *     the existing sync infrastructure keeps working during the migration period.
 *   - There is no cross-database atomicity: a PG write is independent of any MongoDB
 *     transaction. This is an intentional temporary trade-off during migration.
 *     Once all datasources are on Postgres, a PostgresTransactionManager will be
 *     introduced and proper transactional boundaries restored.
 */
export abstract class PostgresDataSource {
  protected pool: pg.Pool;

  private mongoDb: Db;

  private syncNamespace: string;

  constructor(deps: { pool: pg.Pool; mongoDb: Db; syncNamespace: string }) {
    this.pool = deps.pool;
    this.mongoDb = deps.mongoDb;
    this.syncNamespace = deps.syncNamespace;
  }

  /**
   * Execute a query directly against the pool.
   * Use for both reads and writes.
   */
  protected async query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    sql: string,
    params: unknown[] = []
  ): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(sql, params);
  }

  /**
   * Execute a write query and immediately write a sync record to MongoDB updatelogs.
   */
  protected async execute(sql: string, params: unknown[] = []): Promise<pg.QueryResult> {
    const result = await this.pool.query(sql, params);
    await this.writeSyncLog();
    return result;
  }

  /**
   * Write a sync record to MongoDB updatelogs.
   * This keeps the existing sync mechanism working during the migration.
   */
  private async writeSyncLog(): Promise<void> {
    await this.mongoDb.collection('updatelogs').insertOne({
      _id: new ObjectId(),
      timestamp: Date.now(),
      namespace: this.syncNamespace,
      mongoId: new ObjectId(),
      deleted: false,
    });
  }
}
