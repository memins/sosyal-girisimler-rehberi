CREATE TABLE IF NOT EXISTS enterprise_media (
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	media_key TEXT NOT NULL,
	caption TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (enterprise_id, media_key)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_media_enterprise ON enterprise_media(enterprise_id, sort_order);
