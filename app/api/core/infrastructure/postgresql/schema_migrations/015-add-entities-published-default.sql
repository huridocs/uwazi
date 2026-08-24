-- Migration 015: add-entities-published-default
-- Add DEFAULT false to entities.published so the entity mapper no longer needs to set it
-- (published is owned by the entity access policy data source, mirroring the mongo mapper
-- which leaves it undefined).

ALTER TABLE entities ALTER COLUMN "published" SET DEFAULT false;
