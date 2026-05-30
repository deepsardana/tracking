#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "ERROR: DATABASE_URL is not set."
  echo ""
  echo "On Railway:"
  echo "  1. Add a PostgreSQL database to this project (New → Database → PostgreSQL)."
  echo "  2. Open THIS app service → Variables → New Variable → Variable Reference."
  echo "  3. Select the Postgres service → choose DATABASE_URL → Add."
  echo "  4. Redeploy."
  echo ""
  exit 1
fi

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting server on 0.0.0.0:${PORT:-4000}..."
exec node dist/index.js
