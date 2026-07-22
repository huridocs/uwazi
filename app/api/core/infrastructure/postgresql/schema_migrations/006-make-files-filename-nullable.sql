-- Migration 006: make files.filename nullable
-- Legacy URL attachments (type = 'attachment' with a url) do not have a stored
-- filename because there is no actual file on disk. Making the column nullable
-- allows these records to migrate without inventing synthetic filenames.

ALTER TABLE files ALTER COLUMN filename DROP NOT NULL;
