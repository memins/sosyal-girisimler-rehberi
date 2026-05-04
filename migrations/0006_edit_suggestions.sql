CREATE TABLE IF NOT EXISTS edit_suggestions (
	id TEXT PRIMARY KEY,
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	message TEXT NOT NULL,
	contact_email TEXT,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
	rejection_reason TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_edit_suggestions_enterprise ON edit_suggestions(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_edit_suggestions_status ON edit_suggestions(status);
