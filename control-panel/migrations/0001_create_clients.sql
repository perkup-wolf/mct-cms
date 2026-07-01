CREATE TABLE IF NOT EXISTS clients (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  slug         TEXT    NOT NULL UNIQUE,
  domain       TEXT    NOT NULL,
  admin_email  TEXT    NOT NULL,
  worker_name  TEXT,
  db_id        TEXT,
  r2_bucket    TEXT,
  status       TEXT    NOT NULL DEFAULT 'provisioning'
                       CHECK (status IN ('provisioning', 'active', 'error')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  last_checked TEXT
);

CREATE TABLE IF NOT EXISTS super_admins (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
