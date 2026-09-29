-- Migration 024: add-settings-seo
-- Add SEO JSONB column to the settings table

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS "seo" JSONB;
