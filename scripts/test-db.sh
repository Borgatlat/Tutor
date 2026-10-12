#!/usr/bin/env bash
# Builds a throwaway Postgres database, runs every Supabase migration twice
# (they must be safe to re-run), loads the demo seed twice, then runs the
# database tests. Connection comes from the usual PG* variables, e.g.
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres npm run test:db
set -euo pipefail
cd "$(dirname "$0")/.."

DB="tutor_test_$$"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 --set VERBOSITY=terse)
export PGOPTIONS='--client-min-messages=warning'

cleanup() { "${PSQL[@]}" -d postgres -c "drop database if exists $DB" >/dev/null 2>&1 || true; }
trap cleanup EXIT

"${PSQL[@]}" -d postgres -c "create database $DB"
"${PSQL[@]}" -d "$DB" -f supabase/tests/stubs.sql

for round in 1 2; do
  for f in supabase/migrations/*.sql; do
    echo "migrate ($round): $f"
    "${PSQL[@]}" -d "$DB" -f "$f"
  done
done

for round in 1 2; do
  echo "seed ($round): supabase/seed_demo.sql"
  "${PSQL[@]}" -d "$DB" -f supabase/seed_demo.sql >/dev/null
done

PGOPTIONS='--client-min-messages=notice' "${PSQL[@]}" -d "$DB" -f supabase/tests/database.test.sql 2>&1 \
  | sed -e 's/^psql:[^ ]* NOTICE:  /  /' | grep -v '^\s*$'
