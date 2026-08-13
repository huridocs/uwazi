-- Migration 012: add-entities-sharedid-language-unique-index
-- Enforce the invariant that each (sharedId, language) pair exists at most
-- once per tenant. Mirrors the Mongo `sharedId_language` index and backs the
-- insert-only semantics of cloneForLanguage (INSERT ... ON CONFLICT DO NOTHING).

CREATE UNIQUE INDEX IF NOT EXISTS entities_sharedId_language
  ON entities ("tenant_id", "sharedId", "language");
