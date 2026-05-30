# DRG Power Admin

Internal app for **DRG POWER TECHNOLOGY PVT. LTD.** — device inventory (Excel import/export), customers, debit/credit transactions, and **VLTD tax invoices** synced with inventory.

## Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a reachable instance)

## Setup

1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Create a PostgreSQL database:
   ```bash
   createdb customer_db
   ```

3. Configure `server/.env` (copy from `server/.env.example` and adjust `DATABASE_URL` if needed):
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/customer_db?schema=public"
   JWT_SECRET="supersecretkey_change_me"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="admin123"
   PORT=4000
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start both server and client:
   ```bash
   npm run dev
   ```

6. Open http://localhost:5173/ — log in with the credentials from `server/.env`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — 4 stat cards + customer summary table |
| `/customers/summary` | Customer-wise DR/CR/balance; click a name to filter transactions |
| `/customers` | Customer CRUD (add/edit/delete) |
| `/transactions` | Transaction CRUD with filters (customer, type, date range) |
| `/inventory` | Device inventory — import/export Excel or TXT (Sunil DRG list), track Available vs Billed |
| `/bills` | Tax invoices — pick device from inventory (auto serial/IMEI), print DRG bill |

## Project Layout

```
my-app/
├── client/     React + Vite + Tailwind + TanStack Query
└── server/     Express + Prisma + PostgreSQL
```

## Deploy on Railway (npm / Nixpacks)

**Step-by-step:** see [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md)

### 1. Add PostgreSQL and `DATABASE_URL` (required)

The app **will not start** without `DATABASE_URL`. Your deploy log error `Environment variable not found: DATABASE_URL` means this step is missing.

1. In your Railway project: **+ New** → **Database** → **PostgreSQL**.
2. Open your **app service** (not the database service).
3. Go to **Variables** → **+ New Variable** → **Variable Reference** (or **Add Reference**).
4. Select the **PostgreSQL** service → pick **`DATABASE_URL`** → save.
5. **Redeploy** the app service.

You can also add manually (name must be exactly `DATABASE_URL`):

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

(Use the reference picker if the syntax differs in your Railway UI.)

### 2. Other variables (app service)

| Variable | Example |
|----------|---------|
| `JWT_SECRET` | long random string |
| `ADMIN_EMAIL` | `admin@example.com` |
| `ADMIN_PASSWORD` | your password |
| `GST_PERCENT` | `18` (optional) |

### 3. Root directory

Your logs show `server@1.0.0` — Railway is using **`server/`** as the root directory. That is fine; use `server/railway.toml` settings:

- **Build:** `npm run prisma:generate && npm run build`
- **Start:** `npm run start:prod`

To deploy the **full app** (API + React UI), set **Root Directory** to empty (repo root) and use the root `railway.toml`:

- **Build:** `npm run build`
- **Start:** `npm start`

### 4. Builder

Use **Nixpacks**, not Docker. There is **no `Dockerfile` in the repo root** (only `docker/Dockerfile` for local compose). If build logs still say `load build definition from Dockerfile`, set Builder to **Nixpacks** in Railway Settings → Build.

### 5. Health check

`GET /api/health` — works once `DATABASE_URL` is set and migrations succeed.

## Notes

- Auth uses a hardcoded admin credential from env vars — not for production.
- Deleting a customer also deletes all their transactions (cascade).
- See `docs/superpowers/specs/2026-05-27-customer-data-management-design.md` for the full design doc.
- **Open item:** "Payments" column on customer summary — pending clarification from owner.
