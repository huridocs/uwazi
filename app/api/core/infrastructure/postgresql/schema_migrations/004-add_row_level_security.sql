-- Migration 004: 004-add-row-level-security
-- Add Row-level security for templates, thesauri and files tables.


ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE thesauri ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;


CREATE FUNCTION current_tenant() RETURNS text
LANGUAGE sql
STABLE 
AS $$
  SELECT current_setting('app.current_tenant');
$$;

CREATE POLICY tenant_isolation ON templates USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());
CREATE POLICY tenant_isolation ON thesauri USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());
CREATE POLICY tenant_isolation ON files USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());