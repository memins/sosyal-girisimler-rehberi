PRAGMA foreign_keys = ON;

CREATE TABLE enterprises (
	id TEXT PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	short_description TEXT NOT NULL,
	problem TEXT NOT NULL,
	solution TEXT NOT NULL,
	impact TEXT NOT NULL,
	long_content TEXT,
	website_url TEXT,
	instagram_url TEXT,
	logo_key TEXT,
	cover_key TEXT,
	status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
	is_featured INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE audiences (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE business_models (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE countries (
	code TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	flag TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE sdgs (
	id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 17),
	name TEXT NOT NULL,
	color TEXT NOT NULL,
	logo_key TEXT
);

CREATE TABLE enterprise_categories (
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
	PRIMARY KEY (enterprise_id, category_id)
);

CREATE TABLE enterprise_audiences (
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	audience_id TEXT NOT NULL REFERENCES audiences(id) ON DELETE CASCADE,
	PRIMARY KEY (enterprise_id, audience_id)
);

CREATE TABLE enterprise_business_models (
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	business_model_id TEXT NOT NULL REFERENCES business_models(id) ON DELETE CASCADE,
	PRIMARY KEY (enterprise_id, business_model_id)
);

CREATE TABLE enterprise_countries (
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	country_code TEXT NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
	PRIMARY KEY (enterprise_id, country_code)
);

CREATE TABLE enterprise_sdgs (
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	sdg_id INTEGER NOT NULL REFERENCES sdgs(id) ON DELETE CASCADE,
	PRIMARY KEY (enterprise_id, sdg_id)
);

CREATE TABLE submissions (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	contact_email TEXT NOT NULL,
	website_url TEXT,
	problem TEXT,
	solution TEXT,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
	enterprise_id TEXT REFERENCES enterprises(id) ON DELETE SET NULL,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE editorial_lists (
	id TEXT PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE editorial_list_items (
	editorial_list_id TEXT NOT NULL REFERENCES editorial_lists(id) ON DELETE CASCADE,
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	sort_order INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (editorial_list_id, enterprise_id)
);

CREATE TABLE feedback (
	id TEXT PRIMARY KEY,
	enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
	message TEXT NOT NULL,
	contact_email TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_enterprises_status ON enterprises(status);
CREATE INDEX idx_enterprises_featured ON enterprises(is_featured, status);
CREATE INDEX idx_enterprises_slug ON enterprises(slug);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_editorial_lists_status ON editorial_lists(status);
