-- Migration 4: add-row-level-security-policy
-- This migration is adding Row-level Security policy to templates, thesauri and files table

-- Add your schema changes here

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE thesauri ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;


CREATE OR REPLACE FUNCTION current_tenant() RETURNS text
LANGUAGE sql
STABLE 
AS $$
  SELECT current_setting('app.current_tenant');
$$;

CREATE POLICY tenant_isolation ON templates USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());
CREATE POLICY tenant_isolation ON thesauri USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());
CREATE POLICY tenant_isolation ON files USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());