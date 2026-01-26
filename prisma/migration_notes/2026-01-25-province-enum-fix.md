---
title: Convert `Profile.province` from enum[] to enum
date: 2026-01-25
author: automated-note
---

Summary
-------

Converted the `province` column in schema `fnmemberlist`, table `Profile` from an array of enum (`ProvinceTerritory[]`) to a scalar enum (`ProvinceTerritory`). This fixes a Prisma DB push error where Postgres could not cast the existing column automatically.

Actions performed
-----------------

- Backup exported to: /tmp/profile_backup.csv (CSV of `fnmemberlist.Profile`).
- SQL used (executed in a transaction):

```sql
BEGIN;
ALTER TABLE fnmemberlist."Profile" ALTER COLUMN province DROP DEFAULT;
ALTER TABLE fnmemberlist."Profile" ALTER COLUMN province TYPE fnmemberlist."ProvinceTerritory"
  USING (CASE WHEN province IS NULL THEN NULL ELSE province[1] END)::fnmemberlist."ProvinceTerritory";
ALTER TABLE fnmemberlist."Profile" ALTER COLUMN province SET DEFAULT 'MB'::fnmemberlist."ProvinceTerritory";
COMMIT;
```

Result
------

Prisma schema is now in sync with the database. `npx prisma db push --accept-data-loss` completed successfully after this change.

Notes
-----

- If you need to restore the original data, the CSV backup is available at `/tmp/profile_backup.csv` on the host where the command was run.
- Consider creating an idempotent SQL migration if you want this change tracked as part of formal migrations.
