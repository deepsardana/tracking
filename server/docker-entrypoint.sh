#!/bin/sh
set -e

cd /app/server

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Link a PostgreSQL database in Railway."
  exit 1
fi

echo "Applying database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting server on 0.0.0.0:${PORT:-4000}..."
exec node dist/index.js
