import { randomUUID } from 'crypto';
import knex, { type Knex } from 'knex';
import { Client, Pool } from 'pg';

const escapeIdentifier = (identifier: string): string => identifier.replace(/"/g, '""');

type Credentials = { user: string; password: string };

type ConnectionConfig = Credentials & { host: string; port: number; database: string };

type ScratchDatabaseSettings = {
  host: string;
  port: number;
  /** An existing database the superuser connects to while creating and dropping the scratch one. */
  maintenanceDatabase: string;
  /** Superuser: creates, provisions and drops the database. */
  admin: Credentials;
  /** Owns the tables: migrations and backup/restore. */
  migrator: Credentials;
  /** Subject to row level security: tenant data migrations. */
  app: Credentials;
  prefix: string;
  /** The provisioning scripts, in order, run as the superuser inside the new database. */
  provisioningSql: string[];
};

type ScratchConnections = { pool: Pool; migratorKnex: Knex; appKnex: Knex };

/**
 * A throwaway PostgreSQL database configured like the real one: created by the superuser,
 * provisioned with the same scripts, reached as the migrator and app roles. Nothing else
 * connects to it, so its connections carry no migration timeouts. Whoever creates it drops it.
 */
class ScratchDatabase {
  private opened?: ScratchConnections;

  private dropped = false;

  private constructor(
    readonly name: string,
    private readonly settings: ScratchDatabaseSettings
  ) {}

  static async create(settings: ScratchDatabaseSettings): Promise<ScratchDatabase> {
    const name = `${settings.prefix}_${randomUUID().replace(/-/g, '')}`.substring(0, 63);
    const scratch = new ScratchDatabase(name, settings);
    await scratch.asAdmin(settings.maintenanceDatabase, async client =>
      client.query(`CREATE DATABASE "${escapeIdentifier(name)}"`)
    );
    try {
      await scratch.provision();
    } catch (error) {
      await scratch.drop();
      throw error;
    }
    return scratch;
  }

  connections(): ScratchConnections {
    if (this.dropped) throw new Error(`Scratch database ${this.name} was dropped`);
    this.opened ??= {
      pool: new Pool(this.connectionConfig(this.settings.migrator)),
      migratorKnex: this.knexAs(this.settings.migrator),
      appKnex: this.knexAs(this.settings.app),
    };
    return this.opened;
  }

  /** Closes its connections and drops the database. Safe to call more than once. */
  async drop(): Promise<void> {
    if (this.dropped) return;
    this.dropped = true;
    const { opened } = this;
    this.opened = undefined;
    if (opened) {
      await Promise.allSettled([
        opened.pool.end(),
        opened.migratorKnex.destroy(),
        opened.appKnex.destroy(),
      ]);
    }
    await this.asAdmin(this.settings.maintenanceDatabase, async client =>
      client.query(`DROP DATABASE IF EXISTS "${escapeIdentifier(this.name)}" WITH (FORCE)`)
    );
  }

  /** One multi-statement query, the way database/provision_postgres.sh pipes them into psql. */
  private async provision(): Promise<void> {
    await this.asAdmin(this.name, async client =>
      client.query(this.settings.provisioningSql.join(';\n'))
    );
  }

  private async asAdmin<T>(database: string, work: (client: Client) => Promise<T>): Promise<T> {
    const client = new Client({ ...this.connectionConfig(this.settings.admin), database });
    await client.connect();
    try {
      return await work(client);
    } finally {
      await client.end();
    }
  }

  private connectionConfig(credentials: Credentials): ConnectionConfig {
    return {
      host: this.settings.host,
      port: this.settings.port,
      database: this.name,
      user: credentials.user,
      password: credentials.password,
    };
  }

  private knexAs(credentials: Credentials): Knex {
    return knex({
      client: 'pg',
      connection: this.connectionConfig(credentials),
      useNullAsDefault: true,
    });
  }
}

export { ScratchDatabase };
export type { ScratchConnections, ScratchDatabaseSettings };
