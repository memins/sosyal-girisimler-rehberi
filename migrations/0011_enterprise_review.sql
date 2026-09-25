-- Auto-imported enterprises (CSV / scraper) land with needs_review = 1 and
-- show up under "Otomatik Çekildi" in the admin panel until an editor saves them.
ALTER TABLE enterprises ADD COLUMN import_source TEXT;
ALTER TABLE enterprises ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_enterprises_needs_review ON enterprises(needs_review);
