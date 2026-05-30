# Railway deploy checklist

## Nixpacks warning: `$NIXPACKS_PATH`

`UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH'` comes from Railway’s generated Dockerfile, not your repo. It is usually a **warning**; the build can still succeed. Ignore it if `npm run build` completes.

---

## Problem 1: Builds with Docker (`load build definition from Dockerfile`)

Railway **auto-uses Docker** if a file named `Dockerfile` exists in the repo root.

**Fix:** This repo keeps Docker only at `docker/Dockerfile` (for local `docker compose`). Push that change, then in Railway:

1. Service → **Settings** → **Build**
2. **Builder** → **Nixpacks** (not Dockerfile)
3. Redeploy

You should see `npm install` / `npm run build` in logs, **not** `FROM node:20-slim`.

---

## Problem 2: `Environment variable not found: DATABASE_URL`

The app **cannot start** until `DATABASE_URL` exists on **your app service**.

### Steps (pick one)

**Option A — Connect database (easiest)**

1. Project → **+ New** → **Database** → **PostgreSQL**.
2. Open your **app/web service** → **Settings**.
3. Find **Connect** / **Service connections** / **Link database** → select your Postgres service → save.
4. Redeploy the app service.

This usually adds `DATABASE_URL` or `PGHOST`, `PGUSER`, etc. The start script can build `DATABASE_URL` from those.

**Option B — Variable reference**

1. App service → **Variables** → **+ New Variable** → **Variable Reference**.
2. Postgres service → **`DATABASE_URL`** → Add.
3. Add `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` on the same service.
4. Redeploy.

### Deploy latest code

Logs showing `prisma migrate deploy && node dist/index.js` mean an **old build** is running. After pulling latest code, redeploy. You should see:

```text
Running database migrations...
Starting server on 0.0.0.0:8080...
```

### Check

In app service **Variables**, you must see a row named exactly:

```text
DATABASE_URL
```

(with a value like `postgresql://postgres:...@...railway.app:5432/railway`)

If it is only on the Postgres service and **not** on the app service, the app will keep crashing.

---

## Recommended Railway settings (full app: API + UI)

| Setting | Value |
|---------|--------|
| Root Directory | *(empty — repo root)* |
| Builder | Nixpacks |
| Build Command | `npm run build` |
| Start Command | `npm start` |

If **Root Directory** is `server`, only the API runs (no React UI). Use repo root for the full app.

---

## Success logs

```text
Running database migrations...
Applying migration ...
Starting server on 0.0.0.0:8080...
```

Health check: `GET /api/health` → `{"status":"ok"}`
