import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const BCRYPT_ROUNDS = 10;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour for claim/reset tokens

export const AUTH_COOKIE_NAME = 'auth_session';
export const CSRF_COOKIE_NAME = 'csrf_token';

// Hash password with bcrypt
export async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string' || plainPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

// Compare password
export async function comparePassword(plainPassword, hash) {
  if (!plainPassword || !hash) return false;
  return bcrypt.compare(plainPassword, hash);
}

// Generate high-entropy 256-bit hex token
export function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Hash token for database storage (SHA-256)
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Create a new session in SQLite and return raw tokens for cookie
export function createSession(db, userId, role) {
  const sessionToken = generateSecureToken();
  const csrfToken = generateSecureToken();
  const sessionTokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString().replace('T', ' ').substring(0, 19);

  db.prepare(`
    INSERT INTO sessions (user_id, session_token_hash, csrf_token, role, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, sessionTokenHash, csrfToken, role, expiresAt);

  return { sessionToken, csrfToken, expiresAt };
}

// Set auth cookies on Express response
export function setAuthCookies(res, sessionToken, csrfToken) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Session Cookie (HttpOnly)
  res.cookie(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });

  // CSRF Cookie (Accessible to frontend JS for x-csrf-token header)
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

// Clear auth cookies on logout
export function clearAuthCookies(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

// Invalidate session in DB
export function invalidateSession(db, sessionToken) {
  if (!sessionToken) return;
  const tokenHash = hashToken(sessionToken);
  db.prepare(`
    UPDATE sessions
    SET revoked_at = datetime('now')
    WHERE session_token_hash = ? AND revoked_at IS NULL
  `).run(tokenHash);
}

// Authentication Middleware
export function authenticate(req, res, next) {
  const sessionToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (!sessionToken) {
    req.user = null;
    req.session = null;
    return next();
  }

  try {
    const db = getDb();
    const tokenHash = hashToken(sessionToken);

    // Look up unrevoked, unexpired session with user record
    const row = db.prepare(`
      SELECT 
        s.id as session_id,
        s.user_id,
        s.csrf_token,
        s.role as session_role,
        s.expires_at,
        u.id,
        u.full_name,
        u.email,
        u.email_normalized,
        u.role,
        u.status
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token_hash = ?
        AND s.revoked_at IS NULL
        AND datetime(s.expires_at) > datetime('now')
        AND u.status = 'active'
    `).get(tokenHash);

    db.close();

    if (!row) {
      req.user = null;
      req.session = null;
      return next();
    }

    req.user = {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      emailNormalized: row.email_normalized,
      role: row.role,
      status: row.status,
    };

    req.session = {
      id: row.session_id,
      csrfToken: row.csrf_token,
      expiresAt: row.expires_at,
    };

    next();
  } catch (err) {
    req.user = null;
    req.session = null;
    next();
  }
}

// Require authenticated user
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

// Require specific role ('student' or 'admin')
export function requireRole(expectedRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (req.user.role !== expectedRole) {
      return res.status(403).json({ error: 'Access forbidden: Insufficient permissions for this resource.' });
    }
    next();
  };
}

// CSRF validation for authenticated mutation requests
export function validateCsrf(req, res, next) {
  // Only check state-changing methods
  const methodsToCheck = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!methodsToCheck.includes(req.method)) {
    return next();
  }

  // If user is authenticated via cookie session, verify CSRF header
  if (req.session && req.session.csrfToken) {
    const clientToken = req.headers['x-csrf-token'];
    if (!clientToken || clientToken !== req.session.csrfToken) {
      return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
    }
  }

  next();
}

// Create an account claim or password reset token
export function createAccountToken(db, userId, emailNormalized, tokenType) {
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString().replace('T', ' ').substring(0, 19);

  // Invalidate previous unconsumed tokens of same type for this email
  db.prepare(`
    UPDATE account_tokens 
    SET used_at = datetime('now')
    WHERE email_normalized = ? AND token_type = ? AND used_at IS NULL
  `).run(emailNormalized, tokenType);

  db.prepare(`
    INSERT INTO account_tokens (user_id, email_normalized, token_type, token_hash, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, emailNormalized, tokenType, tokenHash, expiresAt);

  return { rawToken, expiresAt };
}

// Verify an account claim or reset token
export function verifyAccountToken(db, rawToken, expectedType) {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const tokenHash = hashToken(rawToken);

  const row = db.prepare(`
    SELECT * FROM account_tokens
    WHERE token_hash = ?
      AND token_type = ?
      AND used_at IS NULL
      AND datetime(expires_at) > datetime('now')
  `).get(tokenHash, expectedType);

  return row || null;
}

// Consume an account token
export function consumeAccountToken(db, rawToken) {
  const tokenHash = hashToken(rawToken);
  db.prepare(`
    UPDATE account_tokens
    SET used_at = datetime('now')
    WHERE token_hash = ?
  `).run(tokenHash);
}

// Bootstrap initial admin account if and only if no admin account exists in database
export async function bootstrapInitialAdmin(
  db,
  email = process.env.INITIAL_ADMIN_EMAIL,
  password = process.env.INITIAL_ADMIN_PASSWORD
) {
  if (!email || !password) {
    return { initialized: false, reason: 'NO_CREDENTIALS' };
  }

  const emailNormalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
    console.warn('[Admin Bootstrap] INITIAL_ADMIN_EMAIL is not a valid email address. Skipping admin provisioning.');
    return { initialized: false, reason: 'INVALID_EMAIL' };
  }

  if (password.length < 8 || !/\d/.test(password)) {
    console.warn('[Admin Bootstrap] INITIAL_ADMIN_PASSWORD must be at least 8 characters and contain at least one number. Skipping admin provisioning.');
    return { initialized: false, reason: 'WEAK_PASSWORD' };
  }

  // Check if ANY admin already exists in the users table
  const existingAdmin = db.prepare('SELECT id, email_normalized FROM users WHERE role = ?').get('admin');
  if (existingAdmin) {
    // CRITICAL SECURITY RULE: Never overwrite an existing admin password on restart
    return { initialized: false, reason: 'ADMIN_EXISTS' };
  }

  // Check if a non-admin user already has this email
  const existingUser = db.prepare('SELECT id, role FROM users WHERE email_normalized = ?').get(emailNormalized);
  if (existingUser) {
    console.warn(`[Admin Bootstrap] Account with email ${emailNormalized} already exists with role ${existingUser.role}. Skipping admin provisioning.`);
    return { initialized: false, reason: 'USER_EXISTS' };
  }

  const passwordHash = await hashPassword(password);
  db.prepare(`
    INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
    VALUES (?, ?, ?, ?, 'admin', 'active')
  `).run('System Administrator', email.trim(), emailNormalized, passwordHash);

  // Never log the password or secret tokens
  console.log(`[Admin Bootstrap] Initial admin account provisioned successfully (${emailNormalized}).`);
  return { initialized: true, email: emailNormalized };
}
