-- Migration 037: add-jobs-tenant-id
-- Tenant jobs are scoped by "namespace" (the tenant name); system jobs use 'system'. Add a
-- nullable "tenant_id" column so the backup tool can select, rewrite and delete one tenant's
-- jobs with the same predicate it uses on every tenant table. Nullable: system jobs belong to
-- no tenant, and they keep "tenant_id" = NULL so export/import/clean never touch them.

ALTER TABLE jobs ADD COLUMN "tenant_id" TEXT;
