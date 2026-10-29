import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb, initializeDb, generateRegistrationId, generateReferralCode } from './db.js';
import { seedDemoData, clearDemoData } from './seed.js';
import {
  hashPassword,
  comparePassword,
  createSession,
  setAuthCookies,
  clearAuthCookies,
  invalidateSession,
  authenticate,
  requireAuth,
  requireRole,
  validateCsrf,
  createAccountToken,
  verifyAccountToken,
  consumeAccountToken,
  generateSecureToken,
  bootstrapInitialAdmin,
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';
app.use(cors({
  origin: (origin, callback) => {
    // 1. Same-origin or non-browser requests (no origin header)
    if (!origin) return callback(null, true);

    // 2. Explicitly allowed origins from CORS_ORIGINS
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // 3. In production, also allow Render subdomains (*.onrender.com) and localhost
    if (isProduction) {
      try {
        const parsed = new URL(origin);
        if (parsed.hostname.endsWith('.onrender.com') || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch {
        // Invalid origin format, fall through to rejection
      }
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '150'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

const registrationLimiter = rateLimit({
  windowMs: 900000,
  max: parseInt(process.env.REGISTRATION_RATE_LIMIT_MAX || '10'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

app.use('/api/', generalLimiter);

// Authentication parsing middleware across all routes
app.use(authenticate);

// CSRF validation on mutating actions
app.use('/api/', validateCsrf);

// Initialize DB schema & provision initial admin account if configured and absent
const dbInit = getDb();
try {
  initializeDb(dbInit);
  await bootstrapInitialAdmin(dbInit);
} catch (err) {
  console.error('[Startup DB Error]:', err.message);
} finally {
  dbInit.close();
}

// ========== CSRF TOKEN ENDPOINT ==========

app.get('/api/auth/csrf', (req, res) => {
  // If session already exists, ensure its csrf token is returned
  let csrfToken = req.session?.csrfToken;
  if (!csrfToken) {
    csrfToken = req.cookies?.[CSRF_COOKIE_NAME] || generateSecureToken();
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
  res.json({ csrfToken });
});

// ========== AUTHENTICATION ENDPOINTS ==========

// 1. Current Session State
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  res.json({ user: req.user });
});

// 2. Student Signup + Workshop Registration
app.post('/api/auth/student/signup', authLimiter, async (req, res) => {
  try {
    const {
      fullName,
      email,
      college,
      graduationYear,
      branch,
      password,
      confirmPassword,
      referralCode,
      acquisitionSource,
      utmSource,
      utmCampaign,
    } = req.body;

    const errors = [];
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      errors.push({ field: 'fullName', message: 'Full name is required (min 2 characters).' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push({ field: 'email', message: 'A valid email address is required.' });
    }
    if (!college || typeof college !== 'string' || college.trim().length < 2) {
      errors.push({ field: 'college', message: 'College or university is required.' });
    }
    const year = parseInt(graduationYear);
    if (!year || year < 2024 || year > 2030) {
      errors.push({ field: 'graduationYear', message: 'Please select a valid graduation year (2024–2030).' });
    }
    if (!branch || typeof branch !== 'string' || branch.trim().length < 2) {
      errors.push({ field: 'branch', message: 'Branch or degree is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long.' });
    } else if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain both letters and at least one number.' });
    }
    if (password !== confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Passwords do not match.' });
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const emailNormalized = email.trim().toLowerCase();
    const db = getDb();

    // Check if user account already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email_normalized = ?').get(emailNormalized);
    if (existingUser) {
      db.close();
      return res.status(409).json({
        error: 'An account with this email already exists. Please log in instead.',
        code: 'ACCOUNT_EXISTS',
      });
    }

    // Check duplicate live registration
    const existingReg = db.prepare('SELECT registration_id FROM registrations WHERE email_normalized = ? AND is_demo = 0').get(emailNormalized);
    if (existingReg) {
      db.close();
      return res.status(409).json({
        error: 'A workshop registration with this email already exists.',
        registrationId: existingReg.registration_id,
        code: 'REGISTRATION_EXISTS',
      });
    }

    // Validate referral code if provided
    let validatedReferral = null;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      const code = referralCode.trim().toUpperCase();
      const referrer = db.prepare('SELECT email_normalized FROM registrations WHERE own_referral_code = ? AND is_demo = 0').get(code);
      if (referrer && referrer.email_normalized !== emailNormalized) {
        validatedReferral = code;
      }
    }

    const registrationId = generateRegistrationId();
    const ownReferralCode = generateReferralCode(fullName.trim());

    // Determine acquisition source
    let source = acquisitionSource || 'direct';
    if (validatedReferral) {
      source = 'referral';
    } else if (utmSource) {
      const srcMap = {
        whatsapp: 'whatsapp',
        classrep: 'class_representative',
        techclub: 'tech_club',
        organic: 'organic',
        email: 'organic',
      };
      source = srcMap[utmSource.toLowerCase()] || source;
    }

    const passwordHash = await hashPassword(password);

    // Transactional insertion: create user account + registration
    let userId;
    const createTransaction = db.transaction(() => {
      const userStmt = db.prepare(`
        INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
        VALUES (?, ?, ?, ?, 'student', 'active')
      `).run(fullName.trim(), email.trim(), emailNormalized, passwordHash);

      userId = userStmt.lastInsertRowid;

      db.prepare(`
        INSERT INTO registrations (
          registration_id, full_name, email, email_normalized, college, graduation_year,
          branch, referral_code_used, acquisition_source, utm_source, utm_campaign,
          own_referral_code, is_demo, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        registrationId,
        fullName.trim(),
        email.trim(),
        emailNormalized,
        college.trim(),
        year,
        branch.trim(),
        validatedReferral,
        source,
        utmSource || null,
        utmCampaign || null,
        ownReferralCode,
        userId
      );
    });

    createTransaction();

    // Create session & cookies
    const { sessionToken, csrfToken } = createSession(db, userId, 'student');
    setAuthCookies(res, sessionToken, csrfToken);

    db.close();

    res.status(201).json({
      message: 'Account created and workshop spot confirmed!',
      user: {
        id: userId,
        fullName: fullName.trim(),
        email: emailNormalized,
        role: 'student',
      },
      registrationId,
      referralCode: ownReferralCode,
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    if (err.message?.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: 'An error occurred during account creation. Please try again.' });
  }
});

// 3. Student Login
app.post('/api/auth/student/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailNormalized = email.trim().toLowerCase();
    const db = getDb();

    // Look up user with student role
    const user = db.prepare('SELECT * FROM users WHERE email_normalized = ? AND role = ?').get(emailNormalized, 'student');

    if (!user || user.status !== 'active') {
      db.close();
      // Generic error avoids account enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      db.close();
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Create authenticated session
    const { sessionToken, csrfToken } = createSession(db, user.id, 'student');
    setAuthCookies(res, sessionToken, csrfToken);

    db.close();

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email_normalized,
        role: 'student',
      },
    });
  } catch (err) {
    console.error('Student login error:', err.message);
    res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
});

// 4. Admin Login
app.post('/api/auth/admin/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailNormalized = email.trim().toLowerCase();
    const db = getDb();

    const admin = db.prepare('SELECT * FROM users WHERE email_normalized = ? AND role = ?').get(emailNormalized, 'admin');

    if (!admin || admin.status !== 'active') {
      db.close();
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const match = await comparePassword(password, admin.password_hash);
    if (!match) {
      db.close();
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const { sessionToken, csrfToken } = createSession(db, admin.id, 'admin');
    setAuthCookies(res, sessionToken, csrfToken);

    db.close();

    res.json({
      message: 'Admin authentication successful.',
      user: {
        id: admin.id,
        fullName: admin.full_name,
        email: admin.email_normalized,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ error: 'An error occurred during admin authentication.' });
  }
});

// 5. Logout
app.post('/api/auth/logout', (req, res) => {
  const sessionToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (sessionToken) {
    const db = getDb();
    invalidateSession(db, sessionToken);
    db.close();
  }
  clearAuthCookies(res);
  res.json({ message: 'Logged out successfully.' });
});

// 6. Change Password (Authenticated Student or Admin)
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 8 || !/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long and contain both letters and numbers.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

    const match = await comparePassword(currentPassword, user.password_hash);
    if (!match) {
      db.close();
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await hashPassword(newPassword);

    // Update password
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, req.user.id);

    // Invalidate all other sessions except current
    const currentToken = req.cookies?.[AUTH_COOKIE_NAME];
    if (currentToken) {
      const { hashToken } = await import('./auth.js');
      const curHash = hashToken(currentToken);
      db.prepare(`
        UPDATE sessions
        SET revoked_at = datetime('now')
        WHERE user_id = ? AND session_token_hash != ? AND revoked_at IS NULL
      `).run(req.user.id, curHash);
    }

    db.close();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// 7. Account Claim: Request Activation Link for Existing Registrations
app.post('/api/auth/claim/request', authLimiter, (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailNormalized = email.trim().toLowerCase();
    const db = getDb();

    // Check if registration exists without an active user
    const reg = db.prepare('SELECT id, full_name, email_normalized, user_id FROM registrations WHERE email_normalized = ? AND is_demo = 0').get(emailNormalized);

    let tokenIssued = false;
    let rawTokenVal = null;

    if (reg) {
      // Check if user already exists
      const user = db.prepare('SELECT id, status FROM users WHERE email_normalized = ?').get(emailNormalized);
      if (!user || user.status === 'pending_claim') {
        const { rawToken } = createAccountToken(db, user?.id || null, emailNormalized, 'claim');
        rawTokenVal = rawToken;
        tokenIssued = true;
      }
    }

    db.close();

    // Honest disclosure in development mode
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({
      message: 'If an unclaimed registration exists for this email, an activation procedure has been registered.',
      developmentNotice: isDev && tokenIssued
        ? `[Dev Only] A claim token was generated for this registration. Admins can view claim links under Admin Operations.`
        : undefined,
    });
  } catch (err) {
    console.error('Claim request error:', err.message);
    res.status(500).json({ error: 'Failed to process claim request.' });
  }
});

// 8. Account Claim: Complete Activation
app.post('/api/auth/claim/complete', authLimiter, async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long and contain both letters and numbers.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const db = getDb();
    const tokenRecord = verifyAccountToken(db, token, 'claim');

    if (!tokenRecord) {
      db.close();
      return res.status(400).json({ error: 'Invalid or expired activation token. Please request a new link.' });
    }

    // Find the associated registration
    const reg = db.prepare('SELECT * FROM registrations WHERE email_normalized = ? AND is_demo = 0').get(tokenRecord.email_normalized);
    if (!reg) {
      db.close();
      return res.status(400).json({ error: 'Associated workshop registration not found.' });
    }

    const passwordHash = await hashPassword(password);
    let userId;

    const claimTransaction = db.transaction(() => {
      // Create user or update existing pending user
      const existingUser = db.prepare('SELECT id FROM users WHERE email_normalized = ?').get(tokenRecord.email_normalized);
      if (existingUser) {
        db.prepare("UPDATE users SET password_hash = ?, status = 'active', updated_at = datetime('now') WHERE id = ?").run(passwordHash, existingUser.id);
        userId = existingUser.id;
      } else {
        const insertUser = db.prepare(`
          INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
          VALUES (?, ?, ?, ?, 'student', 'active')
        `).run(reg.full_name, reg.email, reg.email_normalized, passwordHash);
        userId = insertUser.lastInsertRowid;
      }

      // Link registration to user
      db.prepare('UPDATE registrations SET user_id = ? WHERE id = ?').run(userId, reg.id);

      // Consume token
      consumeAccountToken(db, token);
    });

    claimTransaction();

    // Auto-login newly claimed student
    const { sessionToken, csrfToken } = createSession(db, userId, 'student');
    setAuthCookies(res, sessionToken, csrfToken);

    db.close();

    res.json({
      message: 'Account successfully activated! Welcome to your student dashboard.',
      user: {
        id: userId,
        fullName: reg.full_name,
        email: reg.email_normalized,
        role: 'student',
      },
    });
  } catch (err) {
    console.error('Claim complete error:', err.message);
    res.status(500).json({ error: 'Failed to complete account activation.' });
  }
});

// ========== STUDENT PORTAL ENDPOINTS ==========

// Personal Student Dashboard Data (Strictly scoped to authenticated user)
app.get('/api/student/me', requireRole('student'), (req, res) => {
  try {
    const db = getDb();

    // Find registration strictly belonging to authenticated student
    const reg = db.prepare(`
      SELECT 
        registration_id, full_name, email, college, graduation_year, branch,
        own_referral_code, referral_code_used, acquisition_source, created_at
      FROM registrations
      WHERE (user_id = ? OR email_normalized = ?) AND is_demo = 0
    `).get(req.user.id, req.user.emailNormalized);

    if (!reg) {
      db.close();
      return res.json({
        hasRegistration: false,
        student: {
          fullName: req.user.fullName,
          email: req.user.emailNormalized,
        },
      });
    }

    // Count peers referred by this student
    const referralCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM registrations 
      WHERE referral_code_used = ? AND is_demo = 0
    `).get(reg.own_referral_code);

    // Referral clicks
    const clickCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM referral_clicks
      WHERE referral_code = ? AND is_demo = 0
    `).get(reg.own_referral_code);

    db.close();

    res.json({
      hasRegistration: true,
      student: {
        registrationId: reg.registration_id,
        fullName: reg.full_name,
        email: reg.email,
        college: reg.college,
        graduationYear: reg.graduation_year,
        branch: reg.branch,
        ownReferralCode: reg.own_referral_code,
        referralCodeUsed: reg.referral_code_used,
        acquisitionSource: reg.acquisition_source,
        createdAt: reg.created_at,
      },
      referrals: {
        totalReferred: referralCount?.count || 0,
        totalClicks: clickCount?.count || 0,
      },
    });
  } catch (err) {
    console.error('Student portal error:', err.message);
    res.status(500).json({ error: 'Failed to load student details.' });
  }
});

// ========== PUBLIC REGISTRATION ENDPOINT (Preserved for compatibility) ==========

app.post('/api/register', registrationLimiter, async (req, res) => {
  try {
    const {
      fullName,
      email,
      college,
      graduationYear,
      branch,
      password,
      referralCode,
      acquisitionSource,
      utmSource,
      utmCampaign,
    } = req.body;

    // Validation
    const errors = [];
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      errors.push({ field: 'fullName', message: 'Full name is required (minimum 2 characters).' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push({ field: 'email', message: 'A valid email address is required.' });
    }
    if (!college || typeof college !== 'string' || college.trim().length < 2) {
      errors.push({ field: 'college', message: 'College name is required.' });
    }
    const year = parseInt(graduationYear);
    if (!year || year < 2024 || year > 2030) {
      errors.push({ field: 'graduationYear', message: 'Please enter a valid graduation year (2024–2030).' });
    }
    if (!branch || typeof branch !== 'string' || branch.trim().length < 2) {
      errors.push({ field: 'branch', message: 'Branch or degree is required.' });
    }
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const db = getDb();
    const emailNormalized = email.trim().toLowerCase();

    // Check duplicate
    const existing = db.prepare('SELECT registration_id FROM registrations WHERE email_normalized = ? AND is_demo = 0').get(emailNormalized);
    if (existing) {
      db.close();
      return res.status(409).json({
        error: 'This email is already registered.',
        registrationId: existing.registration_id,
      });
    }

    // Validate referral code if provided
    let validatedReferral = null;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      const code = referralCode.trim().toUpperCase();
      const referrer = db.prepare('SELECT email_normalized FROM registrations WHERE own_referral_code = ? AND is_demo = 0').get(code);
      if (referrer && referrer.email_normalized !== emailNormalized) {
        validatedReferral = code;
      }
    }

    const registrationId = generateRegistrationId();
    const ownReferralCode = generateReferralCode(fullName.trim());

    // Determine acquisition source
    let source = acquisitionSource || 'direct';
    if (validatedReferral) {
      source = 'referral';
    } else if (utmSource) {
      const srcMap = {
        whatsapp: 'whatsapp',
        classrep: 'class_representative',
        techclub: 'tech_club',
        organic: 'organic',
        email: 'organic',
      };
      source = srcMap[utmSource.toLowerCase()] || source;
    }

    let userId = null;
    if (password && typeof password === 'string' && password.length >= 8) {
      const passwordHash = await hashPassword(password);
      const userStmt = db.prepare(`
        INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
        VALUES (?, ?, ?, ?, 'student', 'active')
      `).run(fullName.trim(), email.trim(), emailNormalized, passwordHash);
      userId = userStmt.lastInsertRowid;

      const { sessionToken, csrfToken } = createSession(db, userId, 'student');
      setAuthCookies(res, sessionToken, csrfToken);
    }

    db.prepare(`
      INSERT INTO registrations (
        registration_id, full_name, email, email_normalized, college, graduation_year, branch,
        referral_code_used, acquisition_source, utm_source, utm_campaign, own_referral_code, is_demo, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      registrationId,
      fullName.trim(),
      email.trim(),
      emailNormalized,
      college.trim(),
      year,
      branch.trim(),
      validatedReferral,
      source,
      utmSource || null,
      utmCampaign || null,
      ownReferralCode,
      userId
    );

    db.close();

    res.status(201).json({
      registrationId,
      referralCode: ownReferralCode,
      message: 'Registration successful!',
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    if (err.message?.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

// ========== REFERRAL ENDPOINTS ==========

app.post('/api/referral-click', (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Referral code is required.' });

    const db = getDb();
    const exists = db.prepare('SELECT 1 FROM registrations WHERE own_referral_code = ?').get(code.trim().toUpperCase());
    if (exists) {
      db.prepare('INSERT INTO referral_clicks (referral_code, is_demo) VALUES (?, 0)').run(code.trim().toUpperCase());
    }
    db.close();
    res.json({ tracked: !!exists });
  } catch (err) {
    console.error('Referral click error:', err.message);
    res.status(500).json({ error: 'Failed to track referral click.' });
  }
});

app.get('/api/referral/:code/validate', (req, res) => {
  try {
    const db = getDb();
    const exists = db.prepare('SELECT 1 FROM registrations WHERE own_referral_code = ?').get(req.params.code.trim().toUpperCase());
    db.close();
    res.json({ valid: !!exists });
  } catch (err) {
    res.status(500).json({ error: 'Failed to validate referral code.' });
  }
});

// ========== PROTECTED ADMIN ANALYTICS ENDPOINTS ==========

app.get('/api/analytics/overview', requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const isDemo = req.query.demo === 'true' ? 1 : 0;

    const total = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = ?').get(isDemo);
    const bySource = db.prepare('SELECT acquisition_source as source, COUNT(*) as count FROM registrations WHERE is_demo = ? GROUP BY acquisition_source ORDER BY count DESC').all(isDemo);
    const referralCount = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = ? AND referral_code_used IS NOT NULL').get(isDemo);

    const daily = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM registrations WHERE is_demo = ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(isDemo);

    const byYear = db.prepare('SELECT graduation_year as year, COUNT(*) as count FROM registrations WHERE is_demo = ? GROUP BY graduation_year ORDER BY year').all(isDemo);

    db.close();

    res.json({
      totalRegistrations: total.count,
      target: 500,
      progress: Math.round((total.count / 500) * 100 * 10) / 10,
      bySource,
      referralRegistrations: referralCount.count,
      dailyRegistrations: daily,
      byGraduationYear: byYear,
      isDemo: isDemo === 1,
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

app.get('/api/analytics/registrations', requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const isDemo = req.query.demo === 'true' ? 1 : 0;
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20')));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const source = req.query.source || '';

    let where = 'WHERE is_demo = ?';
    const params = [isDemo];

    if (search) {
      where += ' AND (full_name LIKE ? OR college LIKE ? OR registration_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (source) {
      where += ' AND acquisition_source = ?';
      params.push(source);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM registrations ${where}`).get(...params);
    const rows = db.prepare(`
      SELECT registration_id, full_name, college, graduation_year, branch, acquisition_source, referral_code_used, own_referral_code, created_at
      FROM registrations ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    db.close();

    res.json({
      registrations: rows,
      total: total.count,
      page,
      limit,
      totalPages: Math.ceil(total.count / limit),
      isDemo: isDemo === 1,
    });
  } catch (err) {
    console.error('Registrations list error:', err.message);
    res.status(500).json({ error: 'Failed to load registrations.' });
  }
});

app.get('/api/analytics/export', requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const isDemo = req.query.demo === 'true' ? 1 : 0;

    const rows = db.prepare(`
      SELECT registration_id, full_name, college, graduation_year, branch, acquisition_source, referral_code_used, created_at
      FROM registrations WHERE is_demo = ?
      ORDER BY created_at DESC
    `).all(isDemo);

    db.close();

    // CSV with formula injection mitigation
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      let s = String(val);
      if (/^[=+\-@\t\r]/.test(s)) {
        s = "'" + s;
      }
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        s = '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const headers = ['Registration ID', 'Full Name', 'College', 'Graduation Year', 'Branch', 'Source', 'Referral Code Used', 'Registered At'];
    const csvRows = [headers.join(',')];
    for (const r of rows) {
      csvRows.push([
        escapeCsv(r.registration_id),
        escapeCsv(r.full_name),
        escapeCsv(r.college),
        escapeCsv(r.graduation_year),
        escapeCsv(r.branch),
        escapeCsv(r.acquisition_source),
        escapeCsv(r.referral_code_used),
        escapeCsv(r.created_at),
      ].join(','));
    }

    const filename = isDemo ? 'demo_registrations.csv' : 'registrations.csv';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvRows.join('\n'));
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Failed to export data.' });
  }
});

app.get('/api/analytics/referrals', requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const isDemo = req.query.demo === 'true' ? 1 : 0;

    const referrers = db.prepare(`
      SELECT r1.own_referral_code as code, r1.full_name as referrer_name,
        COUNT(r2.id) as referral_count
      FROM registrations r1
      LEFT JOIN registrations r2 ON r2.referral_code_used = r1.own_referral_code AND r2.is_demo = ?
      WHERE r1.is_demo = ?
      GROUP BY r1.own_referral_code
      HAVING referral_count > 0
      ORDER BY referral_count DESC
      LIMIT 20
    `).all(isDemo, isDemo);

    const clicks = db.prepare(`
      SELECT referral_code as code, COUNT(*) as click_count
      FROM referral_clicks WHERE is_demo = ?
      GROUP BY referral_code
      ORDER BY click_count DESC
      LIMIT 20
    `).all(isDemo);

    const totalReferralRegs = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE is_demo = ? AND referral_code_used IS NOT NULL').get(isDemo);
    const totalClicks = db.prepare('SELECT COUNT(*) as count FROM referral_clicks WHERE is_demo = ?').get(isDemo);

    db.close();

    res.json({
      referrers,
      clicks,
      totalReferralRegistrations: totalReferralRegs.count,
      totalClicks: totalClicks.count,
      isDemo: isDemo === 1,
    });
  } catch (err) {
    console.error('Referral analytics error:', err.message);
    res.status(500).json({ error: 'Failed to load referral analytics.' });
  }
});

app.get('/api/analytics/channels', requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const isDemo = req.query.demo === 'true' ? 1 : 0;

    const channels = db.prepare(`
      SELECT acquisition_source as source, COUNT(*) as count
      FROM registrations WHERE is_demo = ?
      GROUP BY acquisition_source
      ORDER BY count DESC
    `).all(isDemo);

    const config = db.prepare('SELECT * FROM campaign_config ORDER BY sort_order').all();

    db.close();

    const sourceToChannel = {
      whatsapp: 'College WhatsApp/Class Groups',
      class_representative: 'Class Representatives/Direct Outreach',
      tech_club: 'Technical Clubs/Coding Communities',
      referral: 'Student Referrals',
      organic: 'Organic Posts/Email Communities',
      direct: 'Direct',
    };

    const channelData = config.map(c => {
      const matchingSources = Object.entries(sourceToChannel)
        .filter(([, name]) => name === c.channel)
        .map(([src]) => src);
      const actual = channels
        .filter(ch => matchingSources.includes(ch.source))
        .reduce((sum, ch) => sum + ch.count, 0);
      return {
        ...c,
        actual_registrations: actual,
        progress: c.target_registrations > 0 ? Math.round((actual / c.target_registrations) * 100 * 10) / 10 : 0,
      };
    });

    res.json({ channels: channelData, rawSources: channels, isDemo: isDemo === 1 });
  } catch (err) {
    console.error('Channel analytics error:', err.message);
    res.status(500).json({ error: 'Failed to load channel analytics.' });
  }
});

// ========== CAMPAIGN CONFIG (Admin only) ==========

app.get('/api/campaign', requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const config = db.prepare('SELECT * FROM campaign_config ORDER BY sort_order').all();
    db.close();
    res.json({ campaigns: config });
  } catch (err) {
    console.error('Campaign config error:', err.message);
    res.status(500).json({ error: 'Failed to load campaign config.' });
  }
});

app.put('/api/campaign/:id', requireRole('admin'), (req, res) => {
  try {
    const { target_registrations, budget_allocation, status, planned_activities, owner, success_metric } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM campaign_config WHERE id = ?').get(req.params.id);
    if (!existing) {
      db.close();
      return res.status(404).json({ error: 'Campaign channel not found.' });
    }

    db.prepare(`
      UPDATE campaign_config
      SET target_registrations = COALESCE(?, target_registrations),
          budget_allocation = COALESCE(?, budget_allocation),
          status = COALESCE(?, status),
          planned_activities = COALESCE(?, planned_activities),
          owner = COALESCE(?, owner),
          success_metric = COALESCE(?, success_metric)
      WHERE id = ?
    `).run(
      target_registrations ?? null,
      budget_allocation ?? null,
      status ?? null,
      planned_activities ?? null,
      owner ?? null,
      success_metric ?? null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM campaign_config WHERE id = ?').get(req.params.id);
    db.close();

    res.json(updated);
  } catch (err) {
    console.error('Campaign update error:', err.message);
    res.status(500).json({ error: 'Failed to update campaign.' });
  }
});

// ========== ADMIN CLAIM TOKEN ISSUANCE ==========

app.post('/api/admin/issue-claim-token', requireRole('admin'), (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailNormalized = email.trim().toLowerCase();
    const db = getDb();

    const reg = db.prepare('SELECT id, full_name, email_normalized, user_id FROM registrations WHERE email_normalized = ? AND is_demo = 0').get(emailNormalized);
    if (!reg) {
      db.close();
      return res.status(404).json({ error: 'No live registration found for this email address.' });
    }

    const existingUser = db.prepare('SELECT id, status FROM users WHERE email_normalized = ?').get(emailNormalized);
    if (existingUser && existingUser.status === 'active') {
      db.close();
      return res.status(400).json({ error: 'An active user account already exists for this registration.' });
    }

    const { rawToken, expiresAt } = createAccountToken(db, existingUser?.id || null, emailNormalized, 'claim');
    db.close();

    res.json({
      message: 'Claim token issued successfully.',
      email: emailNormalized,
      studentName: reg.full_name,
      token: rawToken,
      expiresAt,
      claimUrl: `/claim-account?token=${rawToken}`,
    });
  } catch (err) {
    console.error('Issue claim token error:', err.message);
    res.status(500).json({ error: 'Failed to issue claim token.' });
  }
});

// ========== DEMO DATA MANAGEMENT (Admin only) ==========

app.post('/api/demo/seed', requireRole('admin'), (req, res) => {
  try {
    const count = seedDemoData(req.body.count || 45);
    res.json({ message: `Seeded ${count} demo registrations.`, count });
  } catch (err) {
    console.error('Seed error:', err.message);
    res.status(500).json({ error: 'Failed to seed demo data.' });
  }
});

app.delete('/api/demo/clear', requireRole('admin'), (req, res) => {
  try {
    clearDemoData();
    res.json({ message: 'Demo data cleared.' });
  } catch (err) {
    console.error('Clear demo error:', err.message);
    res.status(500).json({ error: 'Failed to clear demo data.' });
  }
});

// ========== HEALTH CHECK ==========

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== PRODUCTION STATIC FILE SERVING ==========
// In production, serve the built React frontend from dist/ and
// handle client-side routing by falling back to index.html for
// non-API requests (SPA catch-all).

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', 'dist');

if (process.env.NODE_ENV === 'production' || fs.existsSync(distPath)) {
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(distPath));

  // SPA fallback: any GET request that does NOT start with /api
  // gets served the React app's index.html for client-side routing.
  app.get(/^\/(?!api\/).*/, (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend build not found. Run "npm run build" first.');
    }
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
