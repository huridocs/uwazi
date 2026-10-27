-- Migration 037: current-tenant-rejects-empty
-- current_tenant() raises when the tenant is missing or empty instead of matching no rows

-- A transaction-local tenant leaves the setting empty, not absent, once the transaction ends. Through
-- PgBouncer the next client on that connection would then see no rows instead of an error.
CREATE OR REPLACE FUNCTION raise_missing_tenant() RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RAISE EXCEPTION 'app.current_tenant is not set';
END;
$$;

-- Kept a STABLE SQL function so the planner still inlines it into the row level security policies.
CREATE OR REPLACE FUNCTION current_tenant() RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN current_setting('app.current_tenant', true) <> '' THEN current_setting('app.current_tenant', true)
    ELSE raise_missing_tenant()
  END;
$$;
