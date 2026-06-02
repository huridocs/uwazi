import pg from 'pg';
import { config } from '#api/config.js';
import { tenants } from '#api/tenants/tenantContext.js';

const pools = new Map<string, pg.Pool>();

let poolOverride: pg.Pool | undefined;

export class PostgresConnectionFactory {
  static default(): pg.Pool {
    if (poolOverride) return poolOverride;

    let database = config.postgres.database;
    try {
      database = tenants.current().dbName;
    } catch {
      // no async context — use config default
    }

    return this.forDatabase(database);
  }

  static forDatabase(database: string): pg.Pool {
    if (!pools.has(database)) {
      pools.set(
        database,
        new pg.Pool({
          host: config.postgres.host,
          port: config.postgres.port,
          database,
          user: config.postgres.user,
          password: config.postgres.password,
        })
      );
    }
    return pools.get(database)!;
  }

  static async close(): Promise<void> {
    for (const pool of pools.values()) {
      await pool.end();
    }
    pools.clear();
  }

  static usePool(override: pg.Pool): void {
    poolOverride = override;
  }

  static clearPool(): void {
    poolOverride = undefined;
  }
}
