-- Track how many times each enterprise's public detail page has been viewed.
-- Used by the home page "En çok görüntülenenler" section and any future ranking.

ALTER TABLE enterprises ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_enterprises_view_count ON enterprises(view_count DESC);
