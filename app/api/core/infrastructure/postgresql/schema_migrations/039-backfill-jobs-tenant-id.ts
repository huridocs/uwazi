import type { PgDataMigration } from '#api/core/infrastructure/postgresql/PgDataMigration.js';

/*
 * Backfills jobs."tenant_id" from "namespace" for tenant jobs, leaving system jobs
 * ("namespace" = 'system') at NULL. Global scope: the jobs table has no row level security.
 *
 * Safe to run twice: the write only touches rows still at NULL.
 */

const SYSTEM_NAMESPACE = 'system';

export const migration: PgDataMigration = {
  scope: 'global',

  description: 'Backfill jobs.tenant_id from namespace for tenant jobs',

  reindex: false,

  async up(ctx) {
    await ctx.knex.raw(
      `UPDATE jobs SET "tenant_id" = "namespace" WHERE "namespace" <> ? AND "tenant_id" IS NULL`,
      [SYSTEM_NAMESPACE]
    );
  },
};
