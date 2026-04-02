-- Story 1.5: Add logo_url to escolas table
-- logo_url is nullable — any URL or null accepted
-- No RLS change needed — escolas_select_own policy already covers this column

ALTER TABLE escolas ADD COLUMN logo_url TEXT;
