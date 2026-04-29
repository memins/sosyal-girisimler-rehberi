-- Relax NOT NULL constraint on categories.icon and audiences.icon so admins
-- can create entries without an icon. SQLite doesn't support ALTER COLUMN
-- to drop NOT NULL, so we recreate each table preserving data + indexes.

PRAGMA foreign_keys = OFF;

CREATE TABLE categories_new (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL DEFAULT '',
	sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO categories_new (id, name, icon, sort_order)
	SELECT id, name, COALESCE(icon, ''), sort_order FROM categories;

DROP TABLE categories;
ALTER TABLE categories_new RENAME TO categories;

CREATE TABLE audiences_new (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL DEFAULT '',
	sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO audiences_new (id, name, icon, sort_order)
	SELECT id, name, COALESCE(icon, ''), sort_order FROM audiences;

DROP TABLE audiences;
ALTER TABLE audiences_new RENAME TO audiences;

PRAGMA foreign_keys = ON;
