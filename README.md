# KPD Website & CMS Platform

Kasumigaseki Properties Development (KPD) — Next.js website + ground-up custom CMS,
deployed on Vercel. Scope per the signed Service Agreement between Around The Clock
Media FZ-LLC (agency) and Kasumigaseki Properties Development L.L.C (client).

## Stack

- **Next.js 15** (App Router, TypeScript, Server Actions)
- **Supabase Postgres** via **Prisma** (pooled connection for runtime, direct for migrations)
- **Custom admin CMS** at `/admin` (JWT sessions, bcrypt, edge middleware guard)
- **Vercel Cron** for the RSS moderation pipeline
- The delivered static design is preserved at `/legacy/*` (`public/legacy`) until
  pages are migrated into Next.js (Phase 2).

## Local setup

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL + AUTH_SECRET
npm run db:push               # create schema in your database
npm run db:seed               # articles, developments, CMS page placeholders
npm run dev                   # http://localhost:3000
```

First login at `/admin/login` bootstraps the admin account from
`ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. **Change the password immediately after.**

## Environment variables

See `.env.example`. Key vars:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase **pooled** connection string (port 6543, `?pgbouncer=true`) — used at runtime |
| `DIRECT_URL` | Supabase **direct** connection string (port 5432) — used by `db:push`/`migrate` |
| `AUTH_SECRET` | Session signing secret (≥ 16 chars, keep secret) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin (used only when users table is empty) |
| `SALESFORCE_*` | Salesforce dual-write credentials (client provides) |
| `CRON_SECRET` | Shared secret for `/api/cron/rss-ingest` |
| `R2_*` | Cloudflare R2 asset storage (bucket + API token + public base URL) |

## Deploy to Vercel

1. Push this repo to GitHub/GitLab and import it in Vercel (framework auto-detects Next.js).
2. Create a **Supabase** project (or reuse an existing one) and copy both
   connection strings from *Project Settings → Database*:
   - `DATABASE_URL` → **Transaction pooler** URI (port **6543**, append `?pgbouncer=true`)
   - `DIRECT_URL` → **Session/Direct** URI (port **5432**)
   Add both to Vercel env vars.
3. Add the remaining env vars from `.env.example` (esp. `AUTH_SECRET`, `CRON_SECRET`).
4. Deploy, then run the schema migration + seed against production (use the
   **direct** connection string for these):
   ```bash
   DATABASE_URL="<direct url>" npm run db:push
   DATABASE_URL="<direct url>" npm run db:seed
   ```
5. The RSS ingest cron (`vercel.json`) runs every 30 minutes automatically.

## Contract scope → implementation map (Clause 2)

| Contract item | Where |
|---|---|
| Ground-up custom CMS core | `src/app/admin/**`, `src/lib/auth.ts`, `prisma/schema.prisma` |
| Project module library (Full/Restricted) | `Project` / `ProjectModule` models (`profile` field) |
| Salesforce dual-write | `src/lib/salesforce.ts`, `/api/contact`, `ContactSubmission` |
| RSS filter/approval pipeline | `src/lib/rss.ts`, `/api/cron/rss-ingest`, `RssItem`, admin RSS queue |
| Multi-language (EN/AR/JA) | `*Translation` models (`locale: en/ar/ja`) |
| Footer, Legal pages & FAQ | `StaticPage` model + seeded placeholders (client supplies legal text) |
| Seven x Seven landing page | Phase 2 (CMS wiring behind the client-supplied markup) |

## Delivery phases (Clause 4)

1. **Phase 1** — CMS architecture, project module library, data models ✅ *(this scaffold)*
2. **Phase 2** — Template build-out & CMS administration (migrate legacy pages, project CRUD UI)
3. **Phase 3** — Integrations: Salesforce dual-write live, RSS pipeline live, AR/JA locales
4. **Phase 4** — Content population, QA, CMS training
5. **Phase 5** — Buffer & go-live
