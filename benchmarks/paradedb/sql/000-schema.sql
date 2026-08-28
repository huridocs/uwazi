-- Probe schema.
--
-- Mirrors the real entities table and its RLS policies as closely as possible,
-- because the RLS predicate is the thing most likely to disqualify index
-- pushdown (tradeoffs §I.5) and a simplified copy would hide exactly that.
--
-- Sources:
--   005-add-entities-table.sql
--   010-add-permission-rls-infrastructure.sql
--   011-apply-permission-rls-to-entities.sql
--   004-add-row-level-security-policy.sql  (current_tenant)

CREATE EXTENSION IF NOT EXISTS pg_search;

DROP TABLE IF EXISTS entities CASCADE;

CREATE TABLE entities (
  "_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "sharedId" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL,
  "generatedToc" BOOLEAN,
  "icon" JSONB NOT NULL DEFAULT '{}',
  "creationDate" BIGINT NOT NULL,
  "editDate" BIGINT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "user" TEXT,
  "permissions" JSONB NOT NULL DEFAULT '[]',
  "preview" TEXT,

  PRIMARY KEY ("tenant_id", "_id")
);

-- FINDING (schema): the real table's primary key is composite
-- (tenant_id, _id), but a ParadeDB index takes a single-column key_field.
-- We use _id and rely on it being globally unique. Worth confirming that
-- holds in production before reading anything into multi-tenant results.
CREATE UNIQUE INDEX entities_id_unique ON entities ("_id");

CREATE INDEX idx_entities_sharedId ON entities ("tenant_id", "sharedId");
CREATE INDEX idx_entities_language ON entities ("tenant_id", "language");
CREATE INDEX idx_entities_template ON entities ("tenant_id", "template");

CREATE OR REPLACE FUNCTION current_tenant() RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.current_tenant');
$$;

CREATE OR REPLACE FUNCTION sync_permission_arrays()
RETURNS TRIGGER AS $$
BEGIN
  NEW."_perm_read_refs" := ARRAY(
    SELECT (elem ->> 'refId')
    FROM jsonb_array_elements(NEW."permissions") AS elem
  );
  NEW."_perm_write_refs" := ARRAY(
    SELECT (elem ->> 'refId')
    FROM jsonb_array_elements(NEW."permissions") AS elem
    WHERE (elem ->> 'level') IN ('write', 'mixed')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE entities ADD COLUMN "_perm_read_refs"  TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE entities ADD COLUMN "_perm_write_refs" TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_entities_perm_read_refs  ON entities USING GIN ("_perm_read_refs");
CREATE INDEX idx_entities_perm_write_refs ON entities USING GIN ("_perm_write_refs");

CREATE TRIGGER permission_arrays_sync
  BEFORE INSERT OR UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION sync_permission_arrays();

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Verbatim from migration 010. Three-way disjunction, one branch of which is a
-- GIN array overlap. Whether this survives into a ParadeDB index scan is the
-- single most load-bearing unknown in the whole evaluation.
CREATE POLICY permission_read ON entities
  FOR SELECT
  USING (
    "tenant_id" = current_tenant()
    AND (
      COALESCE(current_setting('uwazi.bypass_rls', true), 'false') = 'true'
      OR "published" = true
      OR "_perm_read_refs" && string_to_array(current_setting('uwazi.ref_ids', true), ',')
    )
  );

CREATE POLICY permission_insert ON entities
  FOR INSERT
  WITH CHECK ("tenant_id" = current_tenant());

-- Probes must not run as superuser: RLS is bypassed for superusers and for the
-- table owner, which would silently turn every collaborator probe into an
-- admin probe -- the exact false-negative §I.5 warns about.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'probe_app') THEN
    CREATE ROLE probe_app LOGIN PASSWORD 'probe_app';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO probe_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO probe_app;
