-- Migration 036: updatelogs key includes namespace
-- One document id can be logged in more than one collection, so the key has to
-- include the namespace. A repeated log of the same document in one namespace
-- is collapsed by the copy, which keeps the later timestamp.

ALTER TABLE updatelogs DROP CONSTRAINT updatelogs_pkey;

ALTER TABLE updatelogs ADD PRIMARY KEY ("tenant_id", "namespace", "id");
