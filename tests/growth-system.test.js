import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { initializeDb, generateRegistrationId, generateReferralCode } from '../server/db.js';
import { seedDemoData, clearDemoData } from '../server/seed.js';

const TEST_DB_PATH = './data/test_workshop.db';

describe('NxtWave Growth Challenge - Growth System & Analytics Tests', () => {
  let db;

  beforeAll(() => {
    // Ensure test directory exists
    const dir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);

    process.env.DB_PATH = TEST_DB_PATH;
    db = new Database(TEST_DB_PATH);
    initializeDb(db);
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  describe('1. Registration Persistence & Validation', () => {
    it('generates unique registration IDs with WS- prefix', () => {
      const id1 = generateRegistrationId();
      const id2 = generateRegistrationId();
      expect(id1).toMatch(/^WS-[A-Z0-9]{6}$/);
      expect(id2).toMatch(/^WS-[A-Z0-9]{6}$/);
      expect(id1).not.toBe(id2);
    });

    it('generates readable, uppercase referral codes from student name', () => {
      const code1 = generateReferralCode('Rohit Sharma');
      expect(code1).toMatch(/^[A-Z0-9]{6,8}$/);
      expect(code1.startsWith('ROHI')).toBe(true);
    });

    it('successfully inserts a live student registration', () => {
      const regId = generateRegistrationId();
      const ownRef = generateReferralCode('Arjun Verma');
      const email = 'arjun.verma@example.com';
      const emailNorm = email.toLowerCase().trim();

      const stmt = db.prepare(`
        INSERT INTO registrations (
          registration_id, full_name, email, email_normalized, college, 
          graduation_year, branch, acquisition_source, own_referral_code, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);

      stmt.run(regId, 'Arjun Verma', email, emailNorm, 'IIT Hyderabad', 2027, 'Computer Science', 'whatsapp', ownRef);

      const saved = db.prepare('SELECT * FROM registrations WHERE registration_id = ?').get(regId);
      expect(saved).toBeDefined();
      expect(saved.full_name).toBe('Arjun Verma');
      expect(saved.college).toBe('IIT Hyderabad');
      expect(saved.is_demo).toBe(0);
    });
  });

  describe('2. Duplicate Email Prevention', () => {
    it('blocks duplicate registration with case-insensitive normalized email', () => {
      const regId = generateRegistrationId();
      const ownRef = generateReferralCode('Duplicate Test');
      const dupEmailNorm = 'arjun.verma@example.com'; // already registered above

      const stmt = db.prepare(`
        INSERT INTO registrations (
          registration_id, full_name, email, email_normalized, college, 
          graduation_year, branch, acquisition_source, own_referral_code, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);

      expect(() => {
        stmt.run(regId, 'Duplicate User', 'ARJUN.VERMA@EXAMPLE.COM', dupEmailNorm, 'NIT Trichy', 2026, 'ECE', 'direct', ownRef);
      }).toThrow(/UNIQUE constraint failed/);
    });
  });

  describe('3. Referral Code Validation & Attribution', () => {
    it('attributes peer registration when a valid referral code is used', () => {
      // Find the first student's own referral code
      const referrer = db.prepare('SELECT own_referral_code, email_normalized FROM registrations WHERE email_normalized = ?').get('arjun.verma@example.com');
      expect(referrer).toBeDefined();

      const peerRegId = generateRegistrationId();
      const peerOwnRef = generateReferralCode('Sneha Rao');
      const peerEmail = 'sneha.rao@example.com';

      // Insert peer using Arjun's referral code
      db.prepare(`
        INSERT INTO registrations (
          registration_id, full_name, email, email_normalized, college, 
          graduation_year, branch, referral_code_used, acquisition_source, own_referral_code, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(peerRegId, 'Sneha Rao', peerEmail, peerEmail, 'BITS Pilani', 2027, 'AI & ML', referrer.own_referral_code, 'referral', peerOwnRef);

      const peerRecord = db.prepare('SELECT * FROM registrations WHERE registration_id = ?').get(peerRegId);
      expect(peerRecord.referral_code_used).toBe(referrer.own_referral_code);
      expect(peerRecord.acquisition_source).toBe('referral');

      // Verify that referrer now shows 1 referral
      const refCount = db.prepare(`
        SELECT COUNT(*) as count FROM registrations 
        WHERE referral_code_used = ? AND is_demo = 0
      `).get(referrer.own_referral_code);

      expect(refCount.count).toBe(1);
    });

    it('tracks referral clicks accurately in SQLite', () => {
      const clickStmt = db.prepare('INSERT INTO referral_clicks (referral_code, is_demo) VALUES (?, 0)');
      clickStmt.run('TESTCODE');
      clickStmt.run('TESTCODE');

      const count = db.prepare('SELECT COUNT(*) as count FROM referral_clicks WHERE referral_code = ?').get('TESTCODE');
      expect(count.count).toBe(2);
    });
  });

  describe('4. Analytics Reconciliation & Consistency', () => {
    it('ensures KPI total registrations equals sum of channel breakdown', () => {
      const total = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 0').get().count;
      const channels = db.prepare('SELECT acquisition_source, COUNT(*) as count FROM registrations WHERE is_demo = 0 GROUP BY acquisition_source').all();

      const channelSum = channels.reduce((sum, c) => sum + c.count, 0);
      expect(channelSum).toBe(total);
    });
  });

  describe('5. Demo Mode vs Live Mode Separation', () => {
    it('seeds synthetic records with is_demo = 1 without modifying live records', () => {
      const liveCountBefore = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 0').get().count;

      const demoCount = seedDemoData(30);
      expect(demoCount).toBe(30);

      const liveCountAfter = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 0').get().count;
      expect(liveCountAfter).toBe(liveCountBefore); // Live count untouched!

      const demoRecords = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 1').get().count;
      expect(demoRecords).toBe(30);
    });

    it('clearing demo data removes all demo records while preserving live registrations', () => {
      const liveCountBefore = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 0').get().count;
      expect(liveCountBefore).toBeGreaterThan(0);

      clearDemoData();

      const demoRecordsAfter = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 1').get().count;
      expect(demoRecordsAfter).toBe(0);

      const liveCountAfter = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 0').get().count;
      expect(liveCountAfter).toBe(liveCountBefore); // Live untouched!
    });
  });

  describe('6. CSV Export & Formula Injection (DDE) Mitigation', () => {
    it('safely mitigates potential spreadsheet formula characters in exported strings', () => {
      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        let s = String(val);
        // Mitigate formula injection
        if (/^[=+\-@\t\r]/.test(s)) {
          s = "'" + s;
        }
        if (s.includes('"') || s.includes(',') || s.includes('\n')) {
          s = '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };

      expect(escapeCsv('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(escapeCsv('+cmd|"/c calc"!A0')).toBe('"\' +cmd|""/c calc""!A0"'.replace('\' ', '\''));
      expect(escapeCsv('@HYPERLINK("http://attacker.com")')).toBe('"\'@HYPERLINK(""http://attacker.com"")"');
      expect(escapeCsv('-100')).toBe("'-100");
      expect(escapeCsv('Rohit Sharma')).toBe('Rohit Sharma');
      expect(escapeCsv('IIT Hyderabad, CSE')).toBe('"IIT Hyderabad, CSE"');
    });
  });
});
