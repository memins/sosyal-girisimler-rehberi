CREATE TABLE IF NOT EXISTS newsletter_subscribers (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created_at
	ON newsletter_subscribers(created_at);
