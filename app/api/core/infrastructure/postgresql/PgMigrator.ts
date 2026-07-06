// eslint-disable-next-line node/no-restricted-import
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

  private readMigrationFiles(): Array<{ delta: number; name: string; filePath: string }> {
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
      .filter((m): m is { delta: number; name: string; filePath: string } => m !== null)
      .sort((a, b) => a.delta - b.delta);

    return migrations;
  }

  private async getAppliedDeltas(): Promise<Set<number>> {
    const result = await this.pool.query<{ delta: number }>(
      `SELECT delta FROM ${TRACKING_TABLE} ORDER BY delta ASC`
    );
    return new Set(result.rows.map(r => r.delta));
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

  /* eslint-disable max-statements */
  async migrate(): Promise<number[]> {
    await this.ensureTrackingTable();

    const migrationFiles = this.readMigrationFiles();
    const appliedDeltas = await this.getAppliedDeltas();
    const pending = migrationFiles.filter(m => !appliedDeltas.has(m.delta));

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
