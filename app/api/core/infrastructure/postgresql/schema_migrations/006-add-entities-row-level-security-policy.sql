-- Migration 006: add-entities-row-level-security-policy
-- Add RLS policy to entities table (closes the gap left by migration 005)

-- entities (migration 005) was created without RLS. templates, thesauri,
-- and files got their tenant_isolation policy in migration 004; this
-- closes that gap for entities.

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON entities
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
