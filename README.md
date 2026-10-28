# NxtWave Growth Challenge Prototype

A production-quality growth system prototype designed for the NxtWave Growth Intern selection assignment.

**Workshop Campaign:** “Build Your First AI Project in 60 Minutes”  
**Campaign Objective:** Attract & register 500 final-year engineering students within 7 days using a strict ₹2,000 budget cap.

---

## 1. System Architecture & Features

This project provides a full-stack web application with separated public student acquisition flows and an internal growth analytics workspace.

### Core Capabilities
1. **Conversion Landing Page (`/`):**
   - Conversion-focused, professional landing page tailored to final-year engineering students.
   - Transparent expectations: 60 minutes, free & online, practical project outcome (Text Summarizer), clear prerequisites, comprehensive FAQ.
   - No fake scarcity counters, fabricated testimonials, or misleading claims.
2. **Student Registration Flow (`/register`):**
   - Robust form validation with React Hook Form & Zod.
   - Normalized email case-insensitivity to block accidental duplicate registrations.
   - Automatic UTM query parameter capture (`?utm_source=...&utm_campaign=...`).
   - Referral attribution tracking with validation (`?ref=CODE`).
   - Unique registration ID generation (`WS-XXXXXX`) and readable personal referral code (`NAME1234`).
3. **Success & Referral Sharing (`/success`):**
   - Confirmation screen displaying unique registration ID.
   - Shareable referral link and code with one-click clipboard copy (and working fallback).
4. **Growth Analytics Dashboard (`/dashboard`):**
   - **Overview:** Real-time KPI cards, progress bar toward the 500-registration target, time-series velocity graph, acquisition channel contribution chart, and graduation year distribution.
   - **Registrations (`/dashboard/registrations`):** Real-time records table with live debounced search, channel filters, pagination, and RFC 4180 CSV export with CSV Formula Injection (DDE) mitigation.
   - **Acquisition Channels (`/dashboard/channels`):** Target vs actual registrations per channel with inline target editing and progress tracking.
   - **Referral Program (`/dashboard/referrals`):** Viral loop analytics, top referrers leaderboard, link click tracking, and anti-fraud rules.
   - **7-Day Campaign Operations (`/dashboard/campaign`):** Tactical 7-day execution sequence, editable ₹2,000 budget allocation plan, and channel operations matrix.
   - **Growth Strategy & Experiments (`/dashboard/experiments`):** Student psychology friction analysis and 3 pre-registered testable growth experiments with statistical decision rules.
5. **Data Mode Isolation (Live vs Demo):**
   - Dual-mode architecture strictly separating live database records (`is_demo = 0`) from synthetic demonstration data (`is_demo = 1`).
   - One-click reseeding and clearing of demo data with zero contamination of genuine registrations.

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Lucide React, Recharts, React Hook Form, Zod.
- **Backend:** Node.js, Express, Helmet, CORS, Express Rate Limit.
- **Database:** SQLite via `better-sqlite3` with Write-Ahead Logging (WAL) and parameterized queries.
- **Testing:** Vitest with automated unit, validation, attribution, and data isolation tests.

---

## 3. Getting Started

### Prerequisites
- Node.js (v18.x or v20.x+)
- npm (v9.x or v10.x+)

### Installation
Clone or navigate to the project directory:

```bash
cd Intern
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default environment variables:
```env
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
DB_PATH=./data/workshop.db
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=150
REGISTRATION_RATE_LIMIT_MAX=10
```

---

## 4. Running the Application

### Development Mode (Client + Server concurrently)
Run both backend Express server (`http://localhost:3001`) and Vite frontend (`http://localhost:5173`):

```bash
npm run dev
```

Alternatively, run them in separate terminals:
```bash
# Terminal 1: Backend Server (Port 3001)
npm run dev:server

# Terminal 2: Vite Client (Port 5173)
npm run dev:client
```

### Production Build & Start
Build the client and start the production server:

```bash
npm run build
npm start
```

The Express server serves the built React app from `dist/` and handles SPA routing. All `/api/*` routes go to the API; everything else returns `index.html` for client-side routing.

### Running Automated Tests
Execute the full test suite with Vitest:

```bash
npm test
```

### Seeding / Clearing Demo Data via CLI
```bash
# Seed 45 synthetic demo registrations
npm run seed

# Clear all demo records
npm run seed:clear
```

### Bootstrapping the Admin Account
```bash
# Uses INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD from .env
npm run admin:bootstrap

# Or pass credentials directly
node server/scripts/bootstrap-admin.js admin@example.com YourStrongPassword1
```

---

## 5. REST API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Server health check |
| `GET` | `/api/auth/csrf` | — | Get CSRF token for mutation requests |
| `GET` | `/api/auth/me` | — | Current session state |
| `POST` | `/api/auth/student/signup` | — | Student signup + workshop registration |
| `POST` | `/api/auth/student/login` | — | Student login |
| `POST` | `/api/auth/admin/login` | — | Admin login |
| `POST` | `/api/auth/logout` | Session | Logout and invalidate session |
| `POST` | `/api/auth/change-password` | Session | Change password (any authenticated user) |
| `POST` | `/api/auth/claim/request` | — | Request account claim token for existing registration |
| `POST` | `/api/auth/claim/complete` | — | Complete account claim with token + new password |
| `GET` | `/api/student/me` | Student | Authenticated student's own dashboard data |
| `POST` | `/api/register` | — | Register a student (rate-limited, validated, deduplicated) |
| `POST` | `/api/referral-click` | — | Log click event on a `?ref=CODE` link |
| `GET` | `/api/referral/:code/validate` | — | Verify if a referral code exists |
| `GET` | `/api/analytics/overview?demo=true\|false` | Admin | Aggregate KPIs, velocity, and breakdowns |
| `GET` | `/api/analytics/registrations?demo=...` | Admin | Paginated and filtered registration records |
| `GET` | `/api/analytics/export?demo=true\|false` | Admin | Download RFC 4180 CSV with DDE injection protection |
| `GET` | `/api/analytics/channels?demo=true\|false` | Admin | Channel targets, actual registrations, and progress |
| `GET` | `/api/analytics/referrals?demo=true\|false` | Admin | Referral leaderboards, click stats, and conversion |
| `GET` | `/api/campaign` | Admin | Get 7-day campaign configuration and targets |
| `PUT` | `/api/campaign/:id` | Admin | Update channel targets, budget, owner, or status |
| `POST` | `/api/admin/issue-claim-token` | Admin | Issue a claim token for a student's registration |
| `POST` | `/api/demo/seed` | Admin | Seed simulated test data (`is_demo = 1`) |
| `DELETE` | `/api/demo/clear` | Admin | Purge synthetic test records |

---

## 6. Privacy, Security & Data Integrity

- **Authentication:** Cookie-based sessions with bcrypt password hashing, server-side session table, and session revocation on logout.
- **CSRF Protection:** Per-session CSRF tokens validated on all state-changing requests via `x-csrf-token` header.
- **RBAC:** Role-based access control with `student` and `admin` roles enforced at the middleware level. Public signup can only create `student` accounts (database CHECK constraint).
- **Cookies:** `HttpOnly` + `Secure` (in production) + `SameSite=Lax` session cookies. CSRF cookie readable by frontend JS.
- **Rate Limiting:** Authentication endpoints (15/15min), registration (10/15min), general API (150/15min).
- **Parameterized Queries:** All database queries use SQLite prepared statements (`db.prepare(...)`) preventing SQL injection.
- **Formula Injection Mitigation:** Exported CSV cells starting with `=, +, -, @, \t, \r` are prefixed with a single quote `'` to prevent DDE code execution.
- **Anti-Fraud Referral System:** Referral codes validated against existing records. Self-referrals blocked.
- **Secrets:** Admin credentials and all environment secrets must be supplied via environment variables — never committed to version control.
- **Data Isolation:** Live records (`is_demo = 0`) and demo records (`is_demo = 1`) are strictly separated. Demo seed/clear operations never touch live data or user accounts.

---

## 7. Deploying to Render

### Architecture

In production, the Express server serves both the API (`/api/*`) and the built React frontend (static files from `dist/`). All non-API GET requests fall back to `index.html` for client-side routing (React Router).

### ⚠️ SQLite Persistence Warning

Render's default filesystem is **ephemeral** — data written to disk is lost on every deploy or restart. To persist the SQLite database, you **must** attach a Render Persistent Disk.

### Step-by-Step Render Setup

1. **Create a Web Service** in the Render Dashboard:
   - **Repository:** Connect your GitHub/GitLab repo
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

2. **Set Environment Variables** in the Render service settings:

   | Variable | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Required for secure cookies, static serving |
   | `DB_PATH` | `/var/data/workshop.db` | Must match the Persistent Disk mount path |
   | `INITIAL_ADMIN_EMAIL` | `your-admin@yourdomain.com` | For initial admin bootstrap |
   | `INITIAL_ADMIN_PASSWORD` | *(strong unique password)* | Min 8 chars, letters + numbers |

   Optional overrides:
   | Variable | Default | Notes |
   |---|---|---|
   | `PORT` | (set by Render automatically) | Do not set manually |
   | `CORS_ORIGINS` | *(empty = same-origin)* | Only needed if frontend is on a different domain |
   | `RATE_LIMIT_MAX_REQUESTS` | `150` | Adjust for production traffic |

3. **Attach a Persistent Disk:**
   - Go to your Render service → **Disks** → **Add Disk**
   - **Mount Path:** `/var/data`
   - **Size:** 1 GB (sufficient for SQLite)
   - This ensures `DB_PATH=/var/data/workshop.db` survives restarts and deploys.

4. **Bootstrap the Admin Account** (first deploy only):
   - After the first deploy succeeds, open the **Shell** tab in Render:
     ```bash
     node server/scripts/bootstrap-admin.js
     ```
   - This reads `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` from the environment.

5. **Verify the deployment:**
   - Visit `https://your-service.onrender.com/api/health` — should return `{"status":"ok",...}`
   - Visit `https://your-service.onrender.com/` — the React landing page should load
   - Visit `https://your-service.onrender.com/login` — should show the student login page (not a 404)
   - Visit `https://your-service.onrender.com/admin/login` — should show the admin login page
   - Log in as admin and verify the dashboard loads at `/dashboard`

### Alternative: Persistent Database Options

If you prefer not to use a Persistent Disk, consider migrating to a cloud-hosted database:
- **Turso** (libSQL, SQLite-compatible, free tier available)
- **LiteFS** (distributed SQLite on Fly.io)
- **PostgreSQL on Render** (requires schema changes and query migration)

The current `better-sqlite3` driver requires a local SQLite file. Switching to Turso/libSQL would be the lowest-effort persistent alternative while keeping SQLite semantics.
