import type pg from 'pg';

/** The Postgres schema version, from the migrator's tracking table (mirrors PgMigrator.getCurrentVersion). */
export async function readSchemaVersion(pool: pg.Pool): Promise<number> {
  const result = await pool.query<{ delta: number }>(
    `SELECT COALESCE(MAX(delta), 0) AS delta FROM pg_migrations`
  );
  return result.rows[0]?.delta ?? 0;
}
