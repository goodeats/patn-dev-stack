#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the patn-dev-stack (Epic Stack) app.
# Safe to run repeatedly: dependencies, database, and the Prisma client are
# all reconciled from the checked-out source and committed migrations/seed.
set -euo pipefail

cd "$(dirname "$0")/.."

# The app runs fully mocked in development; the example env has working values.
if [ ! -f .env ]; then
  cp .env.example .env
fi

# Reproducible dependency install from the committed lockfile.
npm ci

# Recreate the SQLite dev database from migrations and reseed it. `reset
# --force` is idempotent and reruns the seed, giving every agent the same
# admin user, about-me, skills, and project fixtures.
npx prisma migrate reset --force --skip-generate

# Generate the Prisma client, including the typed raw-SQL queries.
npx prisma generate --sql
