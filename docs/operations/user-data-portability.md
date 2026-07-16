# Astra User Data Portability

Use the versioned `astra-portable-user-data` bundle to move one existing account's Self, Ally, chart, and report records between Astra databases.

## Included

- Account email and display name for matching and audit context
- Allies
- Chart requests and chart results
- Report requests, immutable basis snapshots, generated sections, provenance, and results

## Deliberately Excluded

- Better Auth users, sessions, accounts, passwords, OTPs, and verification records
- Roles and admin privileges
- Stars balances, credit ledger entries, purchases, Stripe records, and billing state
- Report share tokens and beta feedback
- Public Composer data

The target user must sign in normally before import. Imports rebind every included record to that existing target user without changing the portable record IDs or internal chart/report references.

## Export

```bash
npm run data:export-user -- \
  --email astramaster@tony.io \
  --source-label local \
  --output .astra-exports/astramaster-local.json
```

The output directory is gitignored and the JSON file is written with owner-only permissions.

## Import

First run a dry run against the intended database:

```bash
ASTRA_DATABASE_URL='postgresql://...' npm run data:import-user -- \
  --input .astra-exports/astramaster-local.json \
  --target-email astramaster@tony.io
```

The dry run prints the exact database fingerprint and create/update counts. Execute only after reviewing both:

```bash
ASTRA_DATABASE_URL='postgresql://...' npm run data:import-user -- \
  --input .astra-exports/astramaster-local.json \
  --target-email astramaster@tony.io \
  --execute \
  --confirm 'database-host/database-name'
```

Imports are atomic and idempotent. Existing records owned by the target account are updated; missing records are created. Any matching ID or result-request mapping owned by another account aborts the entire import.
