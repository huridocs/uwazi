// eslint-disable-next-line no-restricted-imports
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { Knex } from 'knex';
import pg from 'pg';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { PgDataMigration, PgDataMigrationContext } from './PgDataMigration.js';

/** `.sql` schema migrations; `.ts` data migrations, built to `.js`. */
const MIGRATION_FILE_PATTERN = /^(\d+)-([\w-]+)\.(sql|ts|js)$/;
const TRACKING_TABLE = 'pg_migrations';
/** Session advisory lock held for a whole run, so only one migrator applies migrations at a time. */
const MIGRATION_LOCK_KEY = 7_586_011;

type MigrationKind = 'sql' | 'data';

type MigrationFile = { delta: number; name: string; kind: MigrationKind; filePath: string };

type MigrationStatus = {
  delta: number;
  name: string;
  kind: MigrationKind;
  applied: boolean;
  /** Pending but numbered below the highest applied migration: migrate() refuses to run it. */
  outOfOrder: boolean;
};

type MigrateOptions = {
  until?: number;
  heartbeat?: () => Promise<void>;
};

type MigrateResult = { applied: number[]; reindexTenants: string[] };

type PgMigratorDeps = { knex: Knex; logger: Logger };

const noHeartbeat = async () => Promise.resolve();

function parseMigrationFile(
  fileName: string
): { delta: number; name: string; kind: MigrationKind } | null {
  const match = fileName.match(MIGRATION_FILE_PATTERN);
  if (!match) return null;
  return {
    delta: parseInt(match[1], 10),
    name: match[2],
    kind: match[3] === 'sql' ? 'sql' : 'data',
  };
}

export class PgMigrator {
  constructor(
    private migrationsDir: string,
    private pool: pg.Pool,
    private deps: PgMigratorDeps
  ) {}

  private async ensureTrackingTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
        delta INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  }

  private readMigrationFiles(): MigrationFile[] {
    const files = readdirSync(this.migrationsDir);
    const migrations = files
      .map(fileName => {
        const parsed = parseMigrationFile(fileName);
        if (!parsed) return null;
        return {
          ...parsed,
          filePath: path.join(this.migrationsDir, fileName),
        };
      })
      .filter((m): m is MigrationFile => m !== null)
      .sort((a, b) => a.delta - b.delta);

    const seen = new Set<number>();
    const duplicates = migrations
      .map(m => {
        if (seen.has(m.delta)) return m.delta;
        seen.add(m.delta);
        return null;
      })
      .filter((delta): delta is number => delta !== null);

    if (duplicates.length > 0) {
      const duplicateFiles = duplicates.map(delta =>
        migrations.filter(m => m.delta === delta).map(m => m.name)
      );
      throw new Error(
        `Duplicate migration delta(s) in ${this.migrationsDir}: ${duplicates
          .map((delta, i) => `delta ${delta} (${duplicateFiles[i].join(', ')})`)
          .join('; ')}`
      );
    }

    return migrations;
  }

  private async getAppliedDeltas(): Promise<Set<number>> {
    const result = await this.pool.query<{ delta: number }>(
      `SELECT delta FROM ${TRACKING_TABLE} ORDER BY delta ASC`
    );
    return new Set(result.rows.map(r => r.delta));
  }

  async getCurrentVersion(): Promise<number> {
    await this.ensureTrackingTable();
    const result = await this.pool.query<{ delta: number }>(
      `SELECT COALESCE(MAX(delta), 0) as delta FROM ${TRACKING_TABLE}`
    );
    return result.rows[0]?.delta || 0;
  }

  async status(): Promise<{ applied: MigrationStatus[]; pending: MigrationStatus[] }> {
    await this.ensureTrackingTable();

    const migrationFiles = this.readMigrationFiles();
    const appliedDeltas = await this.getAppliedDeltas();

    const highestApplied = PgMigrator.highestApplied(appliedDeltas);
    const statuses = migrationFiles.map(m => ({
      delta: m.delta,
      name: m.name,
      kind: m.kind,
      applied: appliedDeltas.has(m.delta),
      outOfOrder: !appliedDeltas.has(m.delta) && m.delta < highestApplied,
    }));

    return {
      applied: statuses.filter(s => s.applied),
      pending: statuses.filter(s => !s.applied),
    };
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]);
      try {
        return await fn();
      } finally {
        await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]);
      }
    } finally {
      client.release();
    }
  }

  private static highestApplied(appliedDeltas: Set<number>): number {
    return Math.max(0, ...appliedDeltas);
  }

  private static assertForwardOnly(pending: MigrationFile[], appliedDeltas: Set<number>): void {
    const highestApplied = PgMigrator.highestApplied(appliedDeltas);
    const behind = pending.filter(m => m.delta < highestApplied);
    if (behind.length > 0) {
      const names = behind.map(m => `${m.delta} (${m.name})`).join(', ');
      throw new Error(
        `Pending migration delta(s) ${names} are below the highest applied delta ${highestApplied}: renumber them above it`
      );
    }
  }

  async migrate(options: MigrateOptions = {}): Promise<MigrateResult> {
    return this.withLock(async () => this.applyPending(options));
  }

  private async pendingMigrations(until?: number): Promise<MigrationFile[]> {
    await this.ensureTrackingTable();

    const appliedDeltas = await this.getAppliedDeltas();
    const pending = this.readMigrationFiles().filter(m => !appliedDeltas.has(m.delta));
    PgMigrator.assertForwardOnly(pending, appliedDeltas);

    return pending.filter(m => until === undefined || m.delta <= until);
  }

  private async applyPending({
    until,
    heartbeat = noHeartbeat,
  }: MigrateOptions): Promise<MigrateResult> {
    const applied: number[] = [];
    const reindexTenants = new Set<string>();

    for (const migration of await this.pendingMigrations(until)) {
      // eslint-disable-next-line no-await-in-loop
      await (migration.kind === 'sql'
        ? this.applySql(migration)
        : this.applyData(migration, heartbeat, reindexTenants));
      applied.push(migration.delta);
    }

    return { applied, reindexTenants: [...reindexTenants] };
  }

  private async applySql(migration: MigrationFile): Promise<void> {
    const sql = readFileSync(migration.filePath, 'utf-8');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await PgMigrator.record(migration, client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** Runs with no transaction open; recorded only once `up` resolves. */
  private async applyData(
    migration: MigrationFile,
    heartbeat: () => Promise<void>,
    reindexTenants: Set<string>
  ): Promise<void> {
    // An absolute path, not a file URL: Jest's resolver cannot resolve file URLs.
    const { migration: dataMigration }: { migration: PgDataMigration } = await import(
      migration.filePath
    );

    const ctx: PgDataMigrationContext = {
      knex: this.deps.knex,
      logger: this.deps.logger,
      heartbeat,
      reindex: tenantIds => {
        if (!dataMigration.reindex) {
          throw new Error(
            `Migration ${migration.delta} (${migration.name}) reported tenants to reindex but declares reindex: false`
          );
        }
        tenantIds.forEach(tenantId => reindexTenants.add(tenantId));
      },
    };

    await dataMigration.up(ctx);
    await PgMigrator.record(migration, this.pool);
  }

  private static async record(
    migration: MigrationFile,
    queryable: Pick<pg.Pool | pg.PoolClient, 'query'>
  ): Promise<void> {
    await queryable.query(`INSERT INTO ${TRACKING_TABLE} (delta, name) VALUES ($1, $2)`, [
      migration.delta,
      migration.name,
    ]);
  }
}

export type { MigrateOptions, MigrateResult, MigrationKind, MigrationStatus, PgMigratorDeps };
