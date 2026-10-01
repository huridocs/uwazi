-- Migration 026: create-tenants-version
-- A counter that moves whenever the tenant registry changes. Every process polls it and reloads
-- the registry when the number is not the one it saw last.
--
-- Only the fields a running process uses count (the columns of TENANT_FIELDS in
-- app/api/tenants/tenant.ts: keep the list below in sync with it). Operational data written by
-- other tools ("stats", "healthChecks", "metadata"), "extras" and the timestamps do not, or every
-- stats refresh would reload every process.
--
-- The update trigger filters on the values, not with UPDATE OF: PostgresTenantsDataSource.upsert
-- uses ON CONFLICT ... DO UPDATE, which writes every column, so UPDATE OF would fire on a write
-- that only changed "stats".
--
-- Insert and delete are row level on purpose. INSERT ... ON CONFLICT DO UPDATE fires the statement
-- level INSERT trigger even when no row was inserted, so a statement level trigger would count
-- every stats-only upsert. The row level one fires only for rows really inserted; a conflicting
-- row goes through the update trigger and its filter. TRUNCATE has no row level form.
--
-- The single counter row serializes concurrent registry writes. The registry is written a few
-- times a day, so that is fine.

CREATE TABLE IF NOT EXISTS tenants_version (
  "id"      BOOLEAN PRIMARY KEY DEFAULT true CHECK ("id"),
  "version" BIGINT  NOT NULL DEFAULT 0
);

INSERT INTO tenants_version ("id") VALUES (true) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION bump_tenants_version() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE tenants_version SET "version" = "version" + 1;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tenants_version_on_write ON tenants;
CREATE TRIGGER tenants_version_on_write AFTER INSERT OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION bump_tenants_version();

DROP TRIGGER IF EXISTS tenants_version_on_truncate ON tenants;
CREATE TRIGGER tenants_version_on_truncate AFTER TRUNCATE ON tenants
  FOR EACH STATEMENT EXECUTE FUNCTION bump_tenants_version();

DROP TRIGGER IF EXISTS tenants_version_on_update ON tenants;
CREATE TRIGGER tenants_version_on_update AFTER UPDATE ON tenants
  FOR EACH ROW WHEN (
    (OLD."name", OLD."dbName", OLD."indexName", OLD."uploadedDocuments", OLD."attachments",
     OLD."customUploads", OLD."activityLogs", OLD."domain", OLD."featureFlags",
     OLD."globalMatomo", OLD."ciMatomoActive", OLD."maintenance")
    IS DISTINCT FROM
    (NEW."name", NEW."dbName", NEW."indexName", NEW."uploadedDocuments", NEW."attachments",
     NEW."customUploads", NEW."activityLogs", NEW."domain", NEW."featureFlags",
     NEW."globalMatomo", NEW."ciMatomoActive", NEW."maintenance")
  ) EXECUTE FUNCTION bump_tenants_version();
