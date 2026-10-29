-- Migration 041: drop-new-name-generation
-- The property-name repair has set the flag and the application no longer reads it.

ALTER TABLE settings DROP COLUMN IF EXISTS new_name_generation;
