const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, '../../ironscout.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL DEFAULT '',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS briefs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company    TEXT NOT NULL,
    url        TEXT,
    brief_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_briefs_user ON briefs(user_id, created_at DESC);
`);

// Profile columns migration — safe to run on every startup
const existingCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
const profileCols = [
  ['company_name',         'TEXT NOT NULL DEFAULT ""'],
  ['company_url',          'TEXT NOT NULL DEFAULT ""'],
  ['company_size',         'TEXT NOT NULL DEFAULT ""'],
  ['industry',             'TEXT NOT NULL DEFAULT ""'],
  ['service_area',         'TEXT NOT NULL DEFAULT ""'],
  ['service_radius_miles', 'INTEGER NOT NULL DEFAULT 50'],
  ['profile_products',     'TEXT NOT NULL DEFAULT "[]"'],
  ['target_customer',      'TEXT NOT NULL DEFAULT ""'],
  ['profile_complete',     'INTEGER NOT NULL DEFAULT 0'],
];
for (const [col, def] of profileCols) {
  if (!existingCols.includes(col)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
  }
}

module.exports = db;
