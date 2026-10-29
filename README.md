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

## 7. Deploying to Render (Free Tier)

### Architecture Overview

In production on Render, a single Node.js process runs the application:
1. **Express Server:** Listens on the dynamic port supplied by Render (`process.env.PORT`) and handles all `/api/*` REST endpoints.
2. **React 19 Frontend:** Statically served from `dist/` (built during `npm run build`), with automatic SPA fallback (`/^\/(?!api\/).*/`) so direct navigation to deep links (such as `/register`, `/login`, `/admin/login`, `/dashboard`, and `/student/dashboard`) works seamlessly.
3. **SQLite Database:** Runs via `better-sqlite3` targeting `/tmp/workshop.db`.

---

### ⚠️ Render Free Ephemeral Storage Notice

> **Important:** Render Free tier web services run in **ephemeral containers** that spin down after 15 minutes of inactivity and rebuild on each deploy.
> 
> - The database file at `DB_PATH=/tmp/workshop.db` is temporary. Data is preserved across HTTP requests while the instance is awake, but will reset if the container is restarted, redeployed, or spins down from inactivity.
> - This setup is 100% free with **zero paid add-ons**.
> - For long-term production persistence, you can later attach a Render Persistent Disk (requires paid plan) or migrate to a cloud-managed database like Turso (libSQL/SQLite) or PostgreSQL.

---

### Automatic Secure Admin Bootstrap on Startup

Because Render Free tier does not include interactive shell access, the server includes a secure **automatic bootstrap** on startup:
- On container spin-up (or after an ephemeral storage wipe), the server initializes all database tables (`users`, `registrations`, `sessions`, `campaign_config`, etc.).
- It checks if any administrator account exists (`SELECT id FROM users WHERE role = 'admin'`).
- **If and only if no admin account exists**, it provisions the initial admin using `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` defined in your Render Environment Variables.
- **Safety Guarantees:**
  - Existing admin passwords are **never overwritten** on restart.
  - Plaintext passwords and secret hashes are **never printed or logged**.
  - No public admin-creation API endpoint is exposed.
  - Full CSRF token protection and rate limiting remain strictly enforced.

---

### Step-by-Step Render Free Setup

1. **Create a Free Web Service:**
   - Sign in to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** → **Web Service**.
   - Connect your GitHub repository.
   - Choose the **Free** instance type ($0/mo).

2. **Configure Service Settings:**
   - **Name:** `nxtwave-growth-challenge` (or your preferred name)
   - **Environment:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

3. **Configure Environment Variables:**
   Under the **Environment** tab, add the following variables:

   | Variable | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production mode, secure cookies, and static serving |
   | `DB_PATH` | `/tmp/workshop.db` | Writable temporary SQLite database path in Render's container |
   | `INITIAL_ADMIN_EMAIL` | `admin@example.com` *(use your email)* | Email for initial administrator account |
   | `INITIAL_ADMIN_PASSWORD` | *(your strong password, min 8 chars with letters & numbers)* | Secure admin password |

   *Optional overrides:*
   | Variable | Default | Description |
   |---|---|---|
   | `TRUST_PROXY` | `1` | Trusted reverse proxy hops (1 hop for Render). Scopes client IP resolution and prevents IP spoofing |
   | `CORS_ORIGINS` | *(automatic)* | Automatically permits same-origin requests and `*.onrender.com` |
   | `RATE_LIMIT_MAX_REQUESTS` | `150` | Maximum general API requests per 15-minute window |
   | `AUTH_RATE_LIMIT_MAX` | `15` | Maximum failed auth attempts before 15-minute lockout (brute-force protection) |
   | `REGISTRATION_RATE_LIMIT_MAX` | `10` | Maximum registration attempts per 15-minute window |

4. **Deploy & Verify:**
   - Click **Create Web Service**. Render will run the build and launch your service.
   - Once the deploy status turns green (**Live**):
     - **Health check:** Open `https://your-service.onrender.com/api/health` → returns `{"status":"ok",...}`.
     - **Landing page:** Open `https://your-service.onrender.com/` → workshop registration page loads.
     - **Deep links:** Test opening `https://your-service.onrender.com/login` and `https://your-service.onrender.com/admin/login` directly to verify client-side routing.
     - **Admin dashboard:** Log in at `/admin/login` using your configured credentials to access `/dashboard`.

---

### Data Mode & Synthetic Data Separation

- Live registrations (`is_demo = 0`) and synthetic demonstration records (`is_demo = 1`) are strictly isolated.
- The server **never** seeds synthetic registrations automatically into live data on startup.
- You can toggle between Live and Demo datasets directly inside the Admin Dashboard, or use the **Seed Demo Data** button to populate 45 sample records for demonstration purposes at any time.

If you prefer not to use a Persistent Disk, consider migrating to a cloud-hosted database:
- **Turso** (libSQL, SQLite-compatible, free tier available)
- **LiteFS** (distributed SQLite on Fly.io)
- **PostgreSQL on Render** (requires schema changes and query migration)

The current `better-sqlite3` driver requires a local SQLite file. Switching to Turso/libSQL would be the lowest-effort persistent alternative while keeping SQLite semantics.
