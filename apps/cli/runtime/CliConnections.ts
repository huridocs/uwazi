import { config } from '#api/config.js';

type ConnectionNeeds = { redis: boolean };

class CliConnections {
  private static drivers?: ReturnType<typeof CliConnections.loadDrivers>;

  /**
   * MongoDB is always opened: tenants are read from the shared database. PostgreSQL needs no
   * opening, its pool connects lazily on first query.
   */
  static async open({ redis }: ConnectionNeeds): Promise<void> {
    CliConnections.drivers ??= CliConnections.loadDrivers();
    const { DB, Redis } = await CliConnections.drivers;

    await DB.connect(config.DBHOST, config.DBAUTH);
    if (redis) {
      await Redis.connect();
    }
  }

  /**
   * Every open socket keeps Node alive, so a command that skips this never exits. Nothing was
   * opened when the drivers were never loaded.
   */
  static async close(): Promise<void> {
    if (!CliConnections.drivers) {
      return;
    }

    const { PostgresDB, Redis, DB } = await CliConnections.drivers;
    await Promise.allSettled([Redis.disconnect(), PostgresDB.disconnect(), DB.disconnect()]);
  }

  /** Loaded on first open(): the drivers pull in most of the backend, which --help never needs. */
  private static async loadDrivers() {
    const [{ PostgresDB }, { Redis }, { DB }] = await Promise.all([
      import('#api/infrastructure/PostgresDB.js'),
      import('#api/infrastructure/Redis.js'),
      import('#api/odm/index.js'),
    ]);
    return { PostgresDB, Redis, DB };
  }
}

export { CliConnections };
export type { ConnectionNeeds };
