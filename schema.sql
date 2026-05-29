-- Vollständiges D1-Schema (entspricht migrations/0001_init.sql).
-- Praktisch für einen frischen Aufbau: bunx wrangler d1 execute maennerkreis-db --local --file=schema.sql

CREATE TABLE IF NOT EXISTS event_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_slug TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  privacy_consent INTEGER NOT NULL,
  therapy_disclaimer_consent INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reg_event_slug ON event_registrations(event_slug);
CREATE INDEX IF NOT EXISTS idx_reg_email ON event_registrations(email);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  confirm_token TEXT,
  privacy_consent INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  confirmed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_news_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_news_token ON newsletter_subscribers(confirm_token);
