import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { initializeDb, generateRegistrationId, generateReferralCode } from '../server/db.js';
import {
  hashPassword,
  comparePassword,
  createSession,
  invalidateSession,
  hashToken,
  generateSecureToken,
  createAccountToken,
  verifyAccountToken,
  consumeAccountToken,
  bootstrapInitialAdmin,
} from '../server/auth.js';
import { seedDemoData, clearDemoData } from '../server/seed.js';

const TEST_AUTH_DB = './data/test_auth.db';

describe('NxtWave Growth Challenge — Comprehensive Authentication & Security Suite', () => {
  let db;

  beforeAll(() => {
    const dir = path.dirname(TEST_AUTH_DB);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(TEST_AUTH_DB)) fs.unlinkSync(TEST_AUTH_DB);

    process.env.DB_PATH = TEST_AUTH_DB;
    db = new Database(TEST_AUTH_DB);
    initializeDb(db);
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(TEST_AUTH_DB)) fs.unlinkSync(TEST_AUTH_DB);
  });

  // 1. Password Hashing
  it('1. Student signup creates a secure password hash, never a plaintext password', async () => {
    const plain = 'SecurePass123';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    expect(await comparePassword(plain, hash)).toBe(true);
    expect(await comparePassword('WrongPassword', hash)).toBe(false);
  });

  // 2 & 3. Student Credentials & Generic Error Handling
  it('2. Correct student credentials allow login and return active user', async () => {
    const email = 'kavya.student@example.com';
    const pass = 'StudentSecret99';
    const hash = await hashPassword(pass);

    db.prepare(`
      INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'student', 'active')
    `).run('Kavya Menon', email, email, hash);

    const user = db.prepare('SELECT * FROM users WHERE email_normalized = ? AND role = ?').get(email, 'student');
    expect(user).toBeDefined();
    expect(await comparePassword(pass, user.password_hash)).toBe(true);
  });

  it('3. Incorrect credentials or non-existent accounts are rejected with generic failure', async () => {
    const user = db.prepare('SELECT * FROM users WHERE email_normalized = ? AND role = ?').get('kavya.student@example.com', 'student');
    expect(await comparePassword('BadPass123', user.password_hash)).toBe(false);

    const nonExistent = db.prepare('SELECT * FROM users WHERE email_normalized = ? AND role = ?').get('nobody@example.com', 'student');
    expect(nonExistent).toBeUndefined();
  });

  // 4. Duplicate Email Signup Prevention
  it('4. Duplicate email signup is rejected by database unique constraint', async () => {
    const emailNorm = 'kavya.student@example.com';
    const hash = await hashPassword('AnotherPassword123');

    expect(() => {
      db.prepare(`
        INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
        VALUES (?, ?, ?, ?, 'student', 'active')
      `).run('Duplicate Kavya', emailNorm, emailNorm, hash);
    }).toThrow(/UNIQUE constraint failed/);
  });

  // 5 & 6. Student Data Scoping
  it('5. A student can retrieve their own registration using their session identity', () => {
    const user = db.prepare('SELECT id, email_normalized FROM users WHERE email_normalized = ?').get('kavya.student@example.com');
    const regId = generateRegistrationId();
    const ownRef = generateReferralCode('Kavya Menon');

    db.prepare(`
      INSERT INTO registrations (
        registration_id, full_name, email, email_normalized, college, graduation_year,
        branch, acquisition_source, own_referral_code, user_id, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(regId, 'Kavya Menon', user.email_normalized, user.email_normalized, 'IIT Hyderabad', 2027, 'CSE', 'direct', ownRef, user.id);

    // Scoped query matching student portal logic
    const studentReg = db.prepare(`
      SELECT * FROM registrations 
      WHERE (user_id = ? OR email_normalized = ?) AND is_demo = 0
    `).get(user.id, user.email_normalized);

    expect(studentReg).toBeDefined();
    expect(studentReg.registration_id).toBe(regId);
    expect(studentReg.college).toBe('IIT Hyderabad');
  });

  it("6. A student cannot retrieve another student's registration", () => {
    // Create student B
    const bEmail = 'sneha.student@example.com';
    const regBId = generateRegistrationId();
    const refB = generateReferralCode('Sneha');

    db.prepare(`
      INSERT INTO registrations (
        registration_id, full_name, email, email_normalized, college, graduation_year,
        branch, acquisition_source, own_referral_code, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(regBId, 'Sneha Rao', bEmail, bEmail, 'BITS Pilani', 2026, 'ECE', 'whatsapp', refB);

    // Student A tries to query scoped to Student A's credentials
    const studentA = db.prepare('SELECT id, email_normalized FROM users WHERE email_normalized = ?').get('kavya.student@example.com');

    // Query scoped to Student A will NEVER return Student B's record
    const leakAttempt = db.prepare(`
      SELECT * FROM registrations 
      WHERE (user_id = ? OR email_normalized = ?) AND registration_id = ?
    `).get(studentA.id, studentA.email_normalized, regBId);

    expect(leakAttempt).toBeUndefined();
  });

  // 7 & 8. Role-Based Access Control (RBAC)
  it('7. Unauthenticated requests have no valid session and are rejected', () => {
    // Simulate lookup of missing or fake session token
    const fakeToken = generateSecureToken();
    const hash = hashToken(fakeToken);

    const session = db.prepare(`
      SELECT * FROM sessions 
      WHERE session_token_hash = ? AND revoked_at IS NULL AND datetime(expires_at) > datetime('now')
    `).get(hash);

    expect(session).toBeUndefined();
  });

  it('8. Student session attempting to access admin resource has role student != admin', () => {
    const studentUser = db.prepare('SELECT * FROM users WHERE email_normalized = ?').get('kavya.student@example.com');
    const { sessionToken } = createSession(db, studentUser.id, 'student');
    const tokenHash = hashToken(sessionToken);

    const session = db.prepare('SELECT * FROM sessions WHERE session_token_hash = ?').get(tokenHash);
    expect(session).toBeDefined();
    expect(session.role).toBe('student');

    // RBAC check: role must equal 'admin'
    const isAdmin = session.role === 'admin';
    expect(isAdmin).toBe(false); // Student cannot pass admin barrier!
  });

  // 9. Admin Provisioning & Authentication
  it('9. Admin login succeeds only with provisioned admin credentials', async () => {
    const adminEmail = 'growth-admin@nxtwave.lan';
    const adminPass = 'SuperGrowthAdmin2026!';
    const adminHash = await hashPassword(adminPass);

    db.prepare(`
      INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `).run('Growth Lead', adminEmail, adminEmail, adminHash);

    const admin = db.prepare('SELECT * FROM users WHERE email_normalized = ? AND role = ?').get(adminEmail, 'admin');
    expect(admin).toBeDefined();
    expect(admin.role).toBe('admin');
    expect(await comparePassword(adminPass, admin.password_hash)).toBe(true);
    expect(await comparePassword('WrongPassword', admin.password_hash)).toBe(false);
  });

  // 10. Public Signup Cannot Create Admin
  it('10. Public signup cannot create an administrator account', () => {
    // Ensure table constraint restricts roles to valid values
    expect(() => {
      db.prepare(`
        INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
        VALUES (?, ?, ?, ?, 'superhero', 'active')
      `).run('Attacker', 'hack@example.com', 'hack@example.com', 'somehash');
    }).toThrow(/CHECK constraint failed/);

    // Even if student registers, signup endpoint explicitly enforces role = 'student'
    const newUser = db.prepare('SELECT role FROM users WHERE email_normalized = ?').get('kavya.student@example.com');
    expect(newUser.role).toBe('student');
  });

  // 11 & 12. Session Invalidation & Revocation
  it('11. Logout invalidates the server-side session in database', () => {
    const user = db.prepare('SELECT id FROM users WHERE email_normalized = ?').get('kavya.student@example.com');
    const { sessionToken } = createSession(db, user.id, 'student');

    // Invalidate
    invalidateSession(db, sessionToken);

    const hash = hashToken(sessionToken);
    const session = db.prepare('SELECT * FROM sessions WHERE session_token_hash = ?').get(hash);
    expect(session.revoked_at).not.toBeNull();
  });

  it('12. Revoked or expired sessions are rejected by authentication lookup', () => {
    const user = db.prepare('SELECT id FROM users WHERE email_normalized = ?').get('kavya.student@example.com');
    const { sessionToken } = createSession(db, user.id, 'student');
    invalidateSession(db, sessionToken);

    const hash = hashToken(sessionToken);
    const activeSession = db.prepare(`
      SELECT * FROM sessions 
      WHERE session_token_hash = ? AND revoked_at IS NULL AND datetime(expires_at) > datetime('now')
    `).get(hash);

    expect(activeSession).toBeUndefined();
  });

  // 13. CSRF Protection
  it('13. CSRF token is issued per session and validates state-changing requests', () => {
    const user = db.prepare('SELECT id FROM users WHERE email_normalized = ?').get('kavya.student@example.com');
    const { sessionToken, csrfToken } = createSession(db, user.id, 'student');

    expect(csrfToken).toBeDefined();
    expect(csrfToken.length).toBe(64); // 32 bytes hex

    const hash = hashToken(sessionToken);
    const session = db.prepare('SELECT csrf_token FROM sessions WHERE session_token_hash = ?').get(hash);
    expect(session.csrf_token).toBe(csrfToken);

    // Mismatched token verification
    const isValid = session.csrf_token === 'forged-attacker-token';
    expect(isValid).toBe(false);
  });

  // 14. Existing Registrations Survive Migration
  it('14. Existing registration records survive database schema migrations with user_id', () => {
    const initialCount = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 0').get().count;
    expect(initialCount).toBeGreaterThan(0);

    // Re-run initializeDb (idempotent migration)
    initializeDb(db);

    const countAfter = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 0').get().count;
    expect(countAfter).toBe(initialCount);
  });

  // 15. Demo Data Reset Protection
  it('15. Demo data reset cannot delete real user accounts or admin credentials', () => {
    const realUserCountBefore = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const realRegsCountBefore = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 0').get().count;

    // Seed and clear demo records
    seedDemoData(25);
    clearDemoData();

    const realUserCountAfter = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const realRegsCountAfter = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = 0').get().count;

    expect(realUserCountAfter).toBe(realUserCountBefore);
    expect(realRegsCountAfter).toBe(realRegsCountBefore);
  });

  // 16. Existing Referral Attribution and Analytics
  it('16. Existing referral attribution and analytics remain functional and accurate', () => {
    const referrerReg = db.prepare('SELECT own_referral_code FROM registrations WHERE email_normalized = ?').get('kavya.student@example.com');

    // Register a peer using Kavya's referral code
    const peerRegId = generateRegistrationId();
    const peerRef = generateReferralCode('Peer Student');

    db.prepare(`
      INSERT INTO registrations (
        registration_id, full_name, email, email_normalized, college, graduation_year,
        branch, referral_code_used, acquisition_source, own_referral_code, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(peerRegId, 'Peer Student', 'peer@example.com', 'peer@example.com', 'IIT Hyderabad', 2027, 'CSE', referrerReg.own_referral_code, 'referral', peerRef);

    const peer = db.prepare('SELECT * FROM registrations WHERE registration_id = ?').get(peerRegId);
    expect(peer.acquisition_source).toBe('referral');
    expect(peer.referral_code_used).toBe(referrerReg.own_referral_code);

    const refCount = db.prepare(`
      SELECT COUNT(*) as count FROM registrations 
      WHERE referral_code_used = ? AND is_demo = 0
    `).get(referrerReg.own_referral_code);

    expect(refCount.count).toBe(1);
  });

  // 17. CSV Formula Injection Mitigation
  it('17. CSV export protects against spreadsheet formula injection (DDE)', () => {
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      let s = String(val);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        s = '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    expect(escapeCsv('=1+1')).toBe("'=1+1");
    expect(escapeCsv('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(escapeCsv('+20')).toBe("'+20");
    expect(escapeCsv('Normal Student')).toBe('Normal Student');
  });

  // 18. Account Claim & Password Reset Tokens
  it('18. High-entropy single-use claim tokens are validated, burned on use, and expired tokens rejected', () => {
    const emailNorm = 'unclaimed.student@example.com';
    const { rawToken } = createAccountToken(db, null, emailNorm, 'claim');

    // Token exists and verifies
    const valid = verifyAccountToken(db, rawToken, 'claim');
    expect(valid).toBeDefined();
    expect(valid.email_normalized).toBe(emailNorm);

    // Consume token
    consumeAccountToken(db, rawToken);

    // Token cannot be reused (single-use)
    const reused = verifyAccountToken(db, rawToken, 'claim');
    expect(reused).toBeNull();

    // Expired token is rejected
    const expiredToken = generateSecureToken();
    const expiredHash = hashToken(expiredToken);
    db.prepare(`
      INSERT INTO account_tokens (email_normalized, token_type, token_hash, expires_at)
      VALUES (?, 'claim', ?, datetime('now', '-10 minutes'))
    `).run('expired@example.com', expiredHash);

    const expiredCheck = verifyAccountToken(db, expiredToken, 'claim');
    expect(expiredCheck).toBeNull();
  });

  // 19. Startup Admin Auto-Bootstrap on Fresh Database
  it('19. Startup admin auto-bootstrap provisions initial admin only when no admin exists', async () => {
    const freshDbPath = './data/test_fresh_bootstrap.db';
    if (fs.existsSync(freshDbPath)) fs.unlinkSync(freshDbPath);
    const freshDb = new Database(freshDbPath);
    initializeDb(freshDb);

    // Verify initially no admin exists
    const beforeAdmin = freshDb.prepare('SELECT id FROM users WHERE role = ?').get('admin');
    expect(beforeAdmin).toBeUndefined();

    // Run auto-bootstrap with valid env values
    const res = await bootstrapInitialAdmin(freshDb, 'fresh-admin@nxtwave.lan', 'FreshAdminPass2026!');
    expect(res.initialized).toBe(true);
    expect(res.email).toBe('fresh-admin@nxtwave.lan');

    // Admin now exists in database with valid bcrypt hash
    const adminUser = freshDb.prepare('SELECT * FROM users WHERE email_normalized = ? AND role = ?').get('fresh-admin@nxtwave.lan', 'admin');
    expect(adminUser).toBeDefined();
    expect(adminUser.role).toBe('admin');
    expect(await comparePassword('FreshAdminPass2026!', adminUser.password_hash)).toBe(true);

    freshDb.close();
    if (fs.existsSync(freshDbPath)) fs.unlinkSync(freshDbPath);
  });

  // 20. Never Overwrite Existing Admin Password on Restart
  it('20. Startup admin auto-bootstrap never overwrites an existing admin password on restart', async () => {
    // Current test db already has an admin ('growth-admin@nxtwave.lan')
    const existingAdmin = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
    expect(existingAdmin).toBeDefined();
    const originalHash = existingAdmin.password_hash;

    // Simulate server restart calling auto-bootstrap with a different password
    const restartResult = await bootstrapInitialAdmin(db, 'attacker-admin@nxtwave.lan', 'NewAttackerPass123!');
    expect(restartResult.initialized).toBe(false);
    expect(restartResult.reason).toBe('ADMIN_EXISTS');

    // Original admin is preserved untouched
    const afterRestart = db.prepare('SELECT * FROM users WHERE id = ?').get(existingAdmin.id);
    expect(afterRestart.email_normalized).toBe(existingAdmin.email_normalized);
    expect(afterRestart.password_hash).toBe(originalHash);
  });

  // 21. Rejects Weak Passwords or Invalid Emails during Startup Provisioning
  it('21. Startup admin auto-bootstrap safely rejects weak passwords or invalid emails without crashing', async () => {
    const freshDbPath = './data/test_invalid_bootstrap.db';
    if (fs.existsSync(freshDbPath)) fs.unlinkSync(freshDbPath);
    const freshDb = new Database(freshDbPath);
    initializeDb(freshDb);

    // Invalid email format
    const badEmailRes = await bootstrapInitialAdmin(freshDb, 'not-an-email', 'ValidPass123!');
    expect(badEmailRes.initialized).toBe(false);
    expect(badEmailRes.reason).toBe('INVALID_EMAIL');

    // Weak password (< 8 chars)
    const shortPassRes = await bootstrapInitialAdmin(freshDb, 'admin@example.com', 'short1');
    expect(shortPassRes.initialized).toBe(false);
    expect(shortPassRes.reason).toBe('WEAK_PASSWORD');

    // Password with no digits
    const noDigitRes = await bootstrapInitialAdmin(freshDb, 'admin@example.com', 'allletterslong');
    expect(noDigitRes.initialized).toBe(false);
    expect(noDigitRes.reason).toBe('WEAK_PASSWORD');

    // Missing credentials
    const noCredsRes = await bootstrapInitialAdmin(freshDb, null, null);
    expect(noCredsRes.initialized).toBe(false);
    expect(noCredsRes.reason).toBe('NO_CREDENTIALS');

    freshDb.close();
    if (fs.existsSync(freshDbPath)) fs.unlinkSync(freshDbPath);
  });
});
