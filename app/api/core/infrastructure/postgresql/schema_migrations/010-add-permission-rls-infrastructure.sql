-- Migration 010: add reusable permission-level RLS infrastructure
--
-- Creates table-agnostic building blocks that any table can use to enforce
-- permission-based access via native PostgreSQL Row-Level Security:
--
--   - sync_permission_arrays()        : trigger function that derives
--     _perm_read_refs / _perm_write_refs from the permissions JSONB column
--   - create_permission_rls_policies(name) : applies _perm_* columns, GIN
--     indexes, the trigger, and all four RLS policies to a given table
--
-- Tables using this must have these columns (the function creates _perm_*):
--   permissions      JSONB   NOT NULL DEFAULT '[]'
--   published        BOOLEAN NOT NULL
--   tenant_id        TEXT    NOT NULL

-- 1. Trigger function: derive the arrays from the permissions JSONB column.
--    Table-agnostic — references NEW."permissions" etc., so it works on any
--    table with those columns.
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

-- 2. Shared function that sets up everything needed for permission-level RLS on
--    a given table: GIN indexes, trigger, policies.
--
--    PostgreSQL ORs together multiple PERMISSIVE policies that apply to the same
--    command. Therefore the tenant check must be folded into each policy;
--    a separate tenant_isolation policy would short-circuit the permission checks.
--
--    Session variables set by PostgresPermissionEnforcedTable:
--      - uwazi.bypass_rls : 'true' for admin/editor/system
--      - uwazi.ref_ids    : comma-separated actor refIds for collaborators
CREATE OR REPLACE FUNCTION create_permission_rls_policies(table_name text)
RETURNS void AS $$
BEGIN
  -- Add the permission array columns if they don't exist yet.
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "_perm_read_refs" TEXT[] NOT NULL DEFAULT ''{}''', table_name);
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "_perm_write_refs" TEXT[] NOT NULL DEFAULT ''{}''', table_name);

  -- GIN indexes for the overlap checks.
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING GIN ("_perm_read_refs")',
    'idx_' || table_name || '_perm_read_refs', table_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING GIN ("_perm_write_refs")',
    'idx_' || table_name || '_perm_write_refs', table_name);

  -- Attach the shared trigger so every INSERT/UPDATE keeps the arrays in sync.
  EXECUTE format('DROP TRIGGER IF EXISTS permission_arrays_sync ON %I', table_name);
  EXECUTE format('
    CREATE TRIGGER permission_arrays_sync
      BEFORE INSERT OR UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION sync_permission_arrays()
  ', table_name);

  -- Remove old policies so they cannot override permission checks.
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS permission_read ON %I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS permission_write ON %I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS permission_delete ON %I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS permission_insert ON %I', table_name);

  EXECUTE format('
    CREATE POLICY permission_read ON %1$I
      FOR SELECT
      USING (
        "tenant_id" = current_tenant()
        AND (
          COALESCE(current_setting(''uwazi.bypass_rls'', true), ''false'') = ''true''
          OR "published" = true
          OR "_perm_read_refs" && string_to_array(current_setting(''uwazi.ref_ids'', true), '','')
        )
      )
  ', table_name);

  EXECUTE format('
    CREATE POLICY permission_write ON %1$I
      FOR UPDATE
      USING (
        "tenant_id" = current_tenant()
        AND (
          COALESCE(current_setting(''uwazi.bypass_rls'', true), ''false'') = ''true''
          OR "_perm_write_refs" && string_to_array(current_setting(''uwazi.ref_ids'', true), '','')
        )
      )
  ', table_name);

  EXECUTE format('
    CREATE POLICY permission_delete ON %1$I
      FOR DELETE
      USING (
        "tenant_id" = current_tenant()
        AND (
          COALESCE(current_setting(''uwazi.bypass_rls'', true), ''false'') = ''true''
          OR "_perm_write_refs" && string_to_array(current_setting(''uwazi.ref_ids'', true), '','')
        )
      )
  ', table_name);

  EXECUTE format('
    CREATE POLICY permission_insert ON %1$I
      FOR INSERT
      WITH CHECK ("tenant_id" = current_tenant())
  ', table_name);
END;
$$ LANGUAGE plpgsql;
