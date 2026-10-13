#!/usr/bin/env bash
# Rebuilds supabase/all_migrations.sql: every migration in one file, in order,
# for pasting into the Supabase SQL Editor. Run after changing a migration:
#   npm run db:bundle
# CI fails if the bundle is out of date.
set -euo pipefail
cd "$(dirname "$0")/.."
out=supabase/all_migrations.sql
{
  echo "-- ============================================================"
  echo "-- STRAKE JESUIT TUTORS: every database migration in one file"
  echo "-- ============================================================"
  echo "-- Paste this whole file into Supabase → SQL Editor → New query → Run."
  echo "-- Generated from supabase/migrations/ by npm run db:bundle; edit those"
  echo "-- files, not this one. Safe to run more than once."
  echo "-- Demo data is separate: supabase/seed_demo.sql."
  echo "-- ============================================================"
  for f in supabase/migrations/[0-9]*.sql; do
    printf '\n\n-- >>>>>>>>>> %s <<<<<<<<<<\n\n' "$(basename "$f")"
    cat "$f"
  done
} > "$out"
echo "wrote $out"
