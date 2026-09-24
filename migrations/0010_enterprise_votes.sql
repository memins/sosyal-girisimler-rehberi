CREATE TABLE IF NOT EXISTS enterprise_votes (
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	voter_key TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (enterprise_id, voter_key)
);
