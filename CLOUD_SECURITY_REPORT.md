# Cloud Security Report — LumaForge AI Studio

Date: 2026-08-04
Supabase project: `gfqkexnqbjtuwsyqacsw`
Region: `ap-southeast-1`
Status at validation: `ACTIVE_HEALTHY`

## Applied Migrations

1. `lumaforge_cloud_foundation_v1`
   - profiles, projects, assets, edit versions, user presets and export records
   - authenticated grants
   - owner Row Level Security policies
   - user profile lifecycle triggers
   - private `lumaforge-assets` Storage bucket
   - authenticated owner-prefix Storage policies
2. `lumaforge_sync_identifiers_v2`
   - stable local identifiers
   - FORCE ROW LEVEL SECURITY
   - owner-checked project version function
3. `lumaforge_sync_upsert_constraints_v3`
   - regular composite unique indexes for idempotent PostgREST upserts

The repository migration files match the applied database changes.

## Database Assertions

A database assertion block verified:

- all six public application tables exist
- RLS is enabled on every application table
- owner policies exist for database and Storage operations
- `lumaforge-assets` exists and is private

Result: **PASS**

## Owner-Isolation Transaction

A repeatable test used two synthetic user IDs inside a transaction:

- user A saw only user A's project
- user A could not update user B's project
- user A could not delete user B's project
- user A could not insert a project with user B as owner
- the transaction was rolled back

Result: **PASS**

The test is stored at `supabase/tests/rls_owner_isolation.sql`.

## Storage Boundary

Storage object access requires:

- authenticated role
- bucket ID `lumaforge-assets`
- first object-path folder equal to `auth.uid()`

Expected object format:

```text
<user-id>/<project-id>/original/<sanitized-filename>
```

The browser never receives or uses a service-role key.

## Application Sync Safety

- IndexedDB remains the local continuity layer.
- Cloud sync uses stable local IDs and idempotent upserts.
- First-time divergent local/cloud copies stop as a conflict.
- Changes on both sides after the last sync stop as a conflict.
- Users must choose **Keep Local** or **Keep Cloud**.
- No automatic last-write-wins overwrite is used.
- Missing browser environment values produce a truthful configuration-required screen.

## Automated Application Tests

- push decision
- pull decision
- equal decision
- conflict decision
- cloud page without environment does not display fake synchronization success

## Remaining Security Gates

- configure Vercel publishable environment values
- deploy the current cloud branch
- test PKCE magic-link callback on the deployed domain
- test authenticated upload/download/delete through Storage RLS
- test expired session and refresh-token behavior
- review Supabase security advisors after final auth configuration
- run dependency remediation without forced breaking upgrades
- perform full WCAG and penetration testing

## Classification

Cloud database and policy foundation: **TESTED**

Production authenticated cloud synchronization: **PARTIAL / NOT YET DEPLOYMENT-VERIFIED**
