-- Migration 045: entities-title-hash-index
-- Replace the btree index on entities.title with a hash index.
--
-- 043 created entities_title as a btree on the full title value. A btree cannot index a value
-- larger than ~1/3 of a buffer page (2704 bytes on 8 KB pages), so a title longer than that makes
-- CREATE INDEX — or, once the index exists, any INSERT/UPDATE — fail with "index row size exceeds
-- btree maximum". Title lookups are equality-only (title = / title IN (...)), and the Mongo model
-- already indexes title as a hash (title: 'hashed'), so a hash index matches those semantics
-- exactly and has no value-size limit (it stores only the 4-byte hash).

DROP INDEX IF EXISTS entities_title;
CREATE INDEX entities_title ON entities USING hash ("title");
