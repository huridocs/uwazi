import type { PgDataMigration } from '#api/core/infrastructure/postgresql/PgDataMigration.js';
import { applyNewPropertyNames } from './apply_new_property_names/apply.js';

/*
 * Rewrites property names that the old algorithm stored, then sets new_name_generation.
 * Safe to run twice: a tenant whose flag is already true is left untouched, and a rename
 * compares the stored name with the generated one before writing.
 */

export const migration: PgDataMigration = {
  scope: 'tenant',

  description: 'Apply the new property-name algorithm and set new_name_generation',

  reindex: true,

  async up(ctx) {
    await applyNewPropertyNames(ctx);
  },
};
