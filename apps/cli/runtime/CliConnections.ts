import { config } from '#api/config.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { Redis } from '#api/infrastructure/Redis.js';
import { DB } from '#api/odm/index.js';

type ConnectionNeeds = { redis: boolean };

class CliConnections {
  /**
   * MongoDB is always opened: tenants are read from the shared database. PostgreSQL needs no
   * opening, its pool connects lazily on first query.
   */
  static async open({ redis }: ConnectionNeeds): Promise<void> {
    await DB.connect(config.DBHOST, config.DBAUTH);

    if (redis) {
      await Redis.connect();
    }
  }

  /** Every open socket keeps Node alive, so a command that skips this never exits. */
  static async close(): Promise<void> {
    await Promise.allSettled([Redis.disconnect(), PostgresDB.disconnect(), DB.disconnect()]);
  }
}

export { CliConnections };
export type { ConnectionNeeds };
