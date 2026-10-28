import dotenv from 'dotenv';
import { getDb } from '../db.js';
import { hashPassword } from '../auth.js';

dotenv.config();

async function bootstrapAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL || process.argv[2];
  const password = process.env.INITIAL_ADMIN_PASSWORD || process.argv[3];
  const force = process.argv.includes('--force');

  if (!email || !password) {
    console.error('Usage: node server/scripts/bootstrap-admin.js <email> <password> [--force]');
    console.error('Or set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in your .env file.');
    process.exit(1);
  }

  const emailNormalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
    console.error('Error: Please provide a valid email address.');
    process.exit(1);
  }

  // Strong password check: at least 8 chars, 1 uppercase or special, 1 number
  if (password.length < 8 || !/\d/.test(password)) {
    console.error('Error: Admin password must be at least 8 characters long and contain at least one number.');
    process.exit(1);
  }

  const db = getDb();

  // Check if any admin already exists
  const existingAdmin = db.prepare('SELECT id, email FROM users WHERE role = ?').get('admin');

  if (existingAdmin && !force) {
    console.warn(`An administrator account already exists (${existingAdmin.email}).`);
    console.warn('To update the existing admin password, rerun with the --force flag.');
    db.close();
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);

  if (existingAdmin && force) {
    db.prepare(`
      UPDATE users 
      SET email = ?, email_normalized = ?, password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(email.trim(), emailNormalized, passwordHash, existingAdmin.id);
    console.log(`Administrator account (${emailNormalized}) successfully updated.`);
  } else {
    db.prepare(`
      INSERT INTO users (full_name, email, email_normalized, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `).run('System Administrator', email.trim(), emailNormalized, passwordHash);
    console.log(`Administrator account (${emailNormalized}) successfully provisioned.`);
  }

  db.close();
}

bootstrapAdmin().catch((err) => {
  console.error('Bootstrap failed:', err.message);
  process.exit(1);
});
