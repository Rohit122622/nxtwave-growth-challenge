import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function getDb() {
  // On Render Free (ephemeral container), default to /tmp/workshop.db if DB_PATH is not set
  const defaultPath = process.env.RENDER ? '/tmp/workshop.db' : './data/workshop.db';
  const dbPath = process.env.DB_PATH || defaultPath;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initializeDb(db);
  return db;
}

export function initializeDb(db) {
  // Existing core tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      email_normalized TEXT NOT NULL,
      college TEXT NOT NULL,
      graduation_year INTEGER NOT NULL,
      branch TEXT NOT NULL,
      referral_code_used TEXT,
      acquisition_source TEXT DEFAULT 'direct',
      utm_source TEXT,
      utm_campaign TEXT,
      own_referral_code TEXT UNIQUE NOT NULL,
      is_demo INTEGER DEFAULT 0,
      user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(email_normalized, is_demo)
    );

    CREATE TABLE IF NOT EXISTS referral_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_code TEXT NOT NULL,
      clicked_at TEXT DEFAULT (datetime('now')),
      is_demo INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS campaign_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      target_registrations INTEGER NOT NULL,
      planned_activities TEXT,
      budget_allocation INTEGER DEFAULT 0,
      owner TEXT,
      success_metric TEXT,
      status TEXT DEFAULT 'planned',
      sort_order INTEGER DEFAULT 0
    );

    -- Authentication and Account Management Tables
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      email_normalized TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'admin')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pending_claim', 'suspended')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token_hash TEXT UNIQUE NOT NULL,
      csrf_token TEXT NOT NULL,
      role TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS account_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      email_normalized TEXT NOT NULL,
      token_type TEXT NOT NULL CHECK(token_type IN ('claim', 'reset')),
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indices
    CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email_normalized);
    CREATE INDEX IF NOT EXISTS idx_registrations_referral ON registrations(referral_code_used);
    CREATE INDEX IF NOT EXISTS idx_registrations_own_code ON registrations(own_referral_code);
    CREATE INDEX IF NOT EXISTS idx_registrations_demo ON registrations(is_demo);
    CREATE INDEX IF NOT EXISTS idx_registrations_source ON registrations(acquisition_source);
    CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_normalized);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_account_tokens_hash ON account_tokens(token_hash);
  `);

  // Migration: If registrations was created earlier without user_id column, add it safely
  const tableInfo = db.prepare('PRAGMA table_info(registrations)').all();
  const hasUserId = tableInfo.some(col => col.name === 'user_id');
  if (!hasUserId) {
    try {
      db.exec('ALTER TABLE registrations ADD COLUMN user_id INTEGER REFERENCES users(id)');
    } catch {
      // Column might already exist
    }
  }

  // Create index on user_id once column is confirmed
  db.exec('CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id)');

  // Seed default campaign config if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM campaign_config').get();
  if (count.c === 0) {
    const insert = db.prepare(`
      INSERT INTO campaign_config (channel, target_registrations, planned_activities, budget_allocation, owner, success_metric, status, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const campaigns = [
      ['College WhatsApp/Class Groups', 180, 'Post workshop details in engineering college WhatsApp groups with permission from group admins', 200, 'Outreach Lead', '180 registrations from WhatsApp referrals', 'planned', 1],
      ['Class Representatives/Direct Outreach', 120, 'Contact class representatives of final-year batches; provide ready-made forwarding messages', 100, 'Campus Coordinator', '120 registrations attributed to CR outreach', 'planned', 2],
      ['Technical Clubs/Coding Communities', 90, 'Partner with college coding clubs and tech communities to share workshop info', 200, 'Community Manager', '90 registrations from club channels', 'planned', 3],
      ['Student Referrals', 70, 'Enable referral codes for registered students; encourage sharing via referral link', 0, 'Growth Lead', '70 registrations via referral codes', 'planned', 4],
      ['Organic Posts/Email Communities', 40, 'Post on relevant subreddits, Discord servers, and email newsletters with community permission', 500, 'Content Lead', '40 registrations from organic channels', 'planned', 5],
    ];
    for (const c of campaigns) {
      insert.run(...c);
    }
  }
}

export function generateRegistrationId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'WS-';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function generateReferralCode(name) {
  const clean = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}${suffix}`;
}
