// eslint-disable-next-line no-restricted-imports
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import pg from 'pg';

type MigrationStatus = {
  delta: number;
  name: string;
  applied: boolean;
};

const MIGRATION_FILE_PATTERN = /^(\d+)-([\w-]+)\.sql$/;
const TRACKING_TABLE = 'pg_migrations';
/** Session advisory lock held for a whole run, so only one migrator applies migrations at a time. */
const MIGRATION_LOCK_KEY = 7_586_011;

type MigrationFile = { delta: number; name: string; filePath: string };

function parseMigrationFile(fileName: string): { delta: number; name: string } | null {
  const match = fileName.match(MIGRATION_FILE_PATTERN);
  if (!match) return null;
  return {
    delta: parseInt(match[1], 10),
    name: match[2],
  };
}

export class PgMigrator {
  constructor(
    private migrationsDir: string,
    private pool: pg.Pool
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

    const statuses = migrationFiles.map(m => ({
      delta: m.delta,
      name: m.name,
      applied: appliedDeltas.has(m.delta),
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

  private static assertForwardOnly(pending: MigrationFile[], appliedDeltas: Set<number>): void {
    const highestApplied = Math.max(0, ...appliedDeltas);
    const behind = pending.filter(m => m.delta < highestApplied);
    if (behind.length > 0) {
      const names = behind.map(m => `${m.delta} (${m.name})`).join(', ');
      throw new Error(
        `Pending migration delta(s) ${names} are below the highest applied delta ${highestApplied}: renumber them above it`
      );
    }
  }

  async migrate(until?: number): Promise<number[]> {
    return this.withLock(async () => this.applyPending(until));
  }

  /* eslint-disable max-statements */
  private async applyPending(until?: number): Promise<number[]> {
    await this.ensureTrackingTable();

    const migrationFiles = this.readMigrationFiles();
    const appliedDeltas = await this.getAppliedDeltas();
    let pending = migrationFiles.filter(m => !appliedDeltas.has(m.delta));
    PgMigrator.assertForwardOnly(pending, appliedDeltas);

    if (until !== undefined) {
      pending = pending.filter(m => m.delta <= until);
    }

    const applied: number[] = [];
    for (const migration of pending) {
      const sql = readFileSync(migration.filePath, 'utf-8');

      // eslint-disable-next-line no-await-in-loop
      const client = await this.pool.connect();
      try {
        // eslint-disable-next-line no-await-in-loop
        await client.query('BEGIN');
        // eslint-disable-next-line no-await-in-loop
        await client.query(sql);
        // eslint-disable-next-line no-await-in-loop
        await client.query(`INSERT INTO ${TRACKING_TABLE} (delta, name) VALUES ($1, $2)`, [
          migration.delta,
          migration.name,
        ]);
        // eslint-disable-next-line no-await-in-loop
        await client.query('COMMIT');
      } catch (error) {
        // eslint-disable-next-line no-await-in-loop
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      applied.push(migration.delta);
    }

    return applied;
  }
  /* eslint-enable max-statements */
}
