import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { initializeDb } from '../server/db.js';
import { hashPassword } from '../server/auth.js';

const TEST_PROXY_DB = './data/test_proxy_rate_limit.db';

describe('Render Reverse Proxy & Rate Limiting Integration Suite', () => {
  let db;
  let server;
  let baseUrl;
  let app;

  beforeAll(async () => {
    // 1. Prepare clean test database
    const dir = path.dirname(TEST_PROXY_DB);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    ['', '-wal', '-shm'].forEach(ext => {
      const p = `${TEST_PROXY_DB}${ext}`;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    process.env.DB_PATH = TEST_PROXY_DB;
    process.env.NODE_ENV = 'test';
    process.env.AUTH_RATE_LIMIT_MAX = '5'; // Smaller threshold for fast test execution
    process.env.AUTH_RATE_LIMIT_WINDOW_MS = '60000';

    db = new Database(TEST_PROXY_DB);
    initializeDb(db);

    // Seed test admin user
    const adminPassHash = await hashPassword('AdminPass2026!');
    db.prepare(`
      INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `).run('Test Ops Admin', 'ops-admin@nxtwave.lan', 'ops-admin@nxtwave.lan', adminPassHash);

    // 2. Import Express app and spin up dynamic port test server
    const imported = await import('../server/index.js');
    app = imported.app;

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (db) {
      db.close();
    }
    ['', '-wal', '-shm'].forEach(ext => {
      const p = `${TEST_PROXY_DB}${ext}`;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  });

  // 1. Proxy Trust Configuration
  it('1. Express trust proxy is configured to 1 hop (Render reverse proxy)', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  // 2. Proxied Request Handling without Validation Errors
  it('2. Requests with X-Forwarded-For do not trigger ERR_ERL_UNEXPECTED_X_FORWARDED_FOR', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: {
        'x-forwarded-for': '198.51.100.42',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  // 3. Narrowly Scoped Proxy Trust Prevents Client IP Spoofing
  it('3. Narrowly scoped 1-hop configuration trusts the immediate reverse proxy and ignores upstream spoofing', async () => {
    // When an attacker sends X-Forwarded-For: spoofed_ip, client_ip
    // Express with trust proxy = 1 must select client_ip (the 1 hop before Render)
    let capturedIp = null;
    const probeHandler = (req, res) => {
      capturedIp = req.ip;
      res.json({ ip: req.ip });
    };

    app.get('/api/test-ip-probe', probeHandler);

    const res = await fetch(`${baseUrl}/api/test-ip-probe`, {
      headers: {
        'x-forwarded-for': '1.1.1.1, 203.0.113.195',
      },
    });

    expect(res.status).toBe(200);
    expect(capturedIp).toBe('203.0.113.195');
  });

  // 4. Valid Admin Login Flow
  it('4. Valid admin login succeeds and returns authentication payload and cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '198.51.100.99',
      },
      body: JSON.stringify({
        email: 'ops-admin@nxtwave.lan',
        password: 'AdminPass2026!',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Admin authentication successful.');
    expect(body.user.role).toBe('admin');
    expect(body.user.email).toBe('ops-admin@nxtwave.lan');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('auth_session=');
    expect(setCookie).toContain('csrf_token=');
  });

  // 5. Rate Limiting Enforces Brute Force Protection (HTTP 429)
  it('5. Brute force attempts from an IP trigger 429 rate limit lockout', async () => {
    const attackerIp = '203.0.113.77';

    // Send 5 failed login attempts (configured threshold in test environment)
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': attackerIp,
        },
        body: JSON.stringify({
          email: 'ops-admin@nxtwave.lan',
          password: `WrongPassAttempt${i}`,
        }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid admin credentials.');
    }

    // 6th attempt must be blocked by authLimiter with HTTP 429
    const blockedRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': attackerIp,
      },
      body: JSON.stringify({
        email: 'ops-admin@nxtwave.lan',
        password: 'EvenIfPasswordIsCorrectNow',
      }),
    });

    expect(blockedRes.status).toBe(429);
    const blockedBody = await blockedRes.json();
    expect(blockedBody.error).toBe('Too many authentication attempts. Please try again later.');
  });

  // 6. Client IP Isolation Behind Reverse Proxy
  it('6. Rate limiting is isolated per client IP; lockout of attacker does not affect other clients', async () => {
    // Attacker IP (203.0.113.77) is locked out from previous test
    const blockedRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.77',
      },
      body: JSON.stringify({
        email: 'ops-admin@nxtwave.lan',
        password: 'WrongPassword',
      }),
    });
    expect(blockedRes.status).toBe(429);

    // Different legitimate client IP (203.0.113.88) can still authenticate
    const legitRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.88',
      },
      body: JSON.stringify({
        email: 'ops-admin@nxtwave.lan',
        password: 'AdminPass2026!',
      }),
    });

    expect(legitRes.status).toBe(200);
    const legitBody = await legitRes.json();
    expect(legitBody.message).toBe('Admin authentication successful.');
    expect(legitBody.user.role).toBe('admin');
  });
});
