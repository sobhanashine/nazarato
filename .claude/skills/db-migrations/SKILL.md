---
name: db-migrations
description: |
  Use this skill whenever the user is creating, editing, or running a database
  migration, changing a schema, adding/removing a column, changing a column
  type, adding an index, or renaming a table. Enforces: never destructive
  without a backup, always reversible, consistent naming, and indexing
  discipline. Schema mistakes haunt you for years.
---

# Database Migrations

## Hard rules

1. **Never destructive without a backup.** `DROP COLUMN`, `DROP TABLE`, type
   narrowing, and `NOT NULL` additions on populated columns require: (a) a
   recent backup confirmed, (b) a rollback migration written first.
2. **Always reversible.** Every `up` has a real `down`. "Down is a no-op"
   is only acceptable for additive changes on empty tables.
3. **Two-phase for renames.** Add new column → backfill → dual-write → cut
   over reads → drop old column. Never rename in a single migration on a live
   table.
4. **Index before you query.** Any new column used in a `WHERE`, `JOIN`, or
   `ORDER BY` gets an index in the same migration.
5. **Locking.** Flag any migration that takes an `ACCESS EXCLUSIVE` lock on a
   large table. Prefer `CREATE INDEX CONCURRENTLY`, `ALTER TABLE ... ADD
   COLUMN ... NULL` then backfill, etc.

## Naming

- Migration filenames: `<timestamp>_<verb>_<object>.sql` (e.g.
  `20260518_add_users_stripe_customer_id.sql`).
- Tables: plural snake_case (`users`, `subscription_events`).
- Columns: snake_case. Booleans prefixed `is_` or `has_`. Timestamps suffixed
  `_at`. Foreign keys `<table_singular>_id`.
- Indexes: `idx_<table>_<columns>`. Unique: `uq_<table>_<columns>`.

## Before applying

Print a one-line summary:
`Migration: <name> — <reversible|DESTRUCTIVE> — <lock level> — backup: <yes|n/a>`

Wait for explicit confirmation before running against any non-local database.
