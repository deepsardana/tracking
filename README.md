# Customer Admin Dashboard

Internal admin tool for managing customers and debit/credit transactions.

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
| `/bills` | Bills with line items, fixed GST %, device/vehicle (default PDD / HR73) |

## Project Layout

```
my-app/
├── client/     React + Vite + Tailwind + TanStack Query
└── server/     Express + Prisma + PostgreSQL
```

## Deploy on Railway (npm / Nixpacks)

Railway is configured for **npm**, not Docker (`railway.toml` → `builder = "NIXPACKS"`).

1. Create a **PostgreSQL** plugin and link it to the app (`DATABASE_URL`).
2. Set variables: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `GST_PERCENT`.
3. In Railway **Settings → Build**:
   - Builder: **Nixpacks** (or Railpack)
   - Build command: `npm run build` (default from `railway.toml`)
   - Start command: `npm start` (runs migrations + server)
4. If Railway still builds with Docker, turn off **Use Dockerfile** or delete the Dockerfile from the repo branch you deploy.
5. Health check: `GET /api/health`

Local Docker (`Dockerfile`) is optional and not used by Railway when Nixpacks is selected.

## Notes

- Auth uses a hardcoded admin credential from env vars — not for production.
- Deleting a customer also deletes all their transactions (cascade).
- See `docs/superpowers/specs/2026-05-27-customer-data-management-design.md` for the full design doc.
- **Open item:** "Payments" column on customer summary — pending clarification from owner.
