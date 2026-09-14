# AGENTS.md

KPD (Kasumigaseki Properties Development) — Next.js 15 website + ground-up custom CMS. This is a **Phase 1 scaffold**: the CMS is functional, but the public-facing design is still the delivered static site (`public/legacy`). See README.md for the contract-scope map and delivery phases.

## Commands

```bash
npm install            # postinstall runs `prisma generate` automatically
npm run dev            # http://localhost:3000
npm run build          # prisma generate && next build
npm start              # production server (after build)
npm run db:push        # Prisma schema sync — uses DIRECT_URL (see DB gotchas)
npm run db:seed        # tsx prisma/seed.ts — idempotent articles/projects/pages
npm run db:studio      # Prisma Studio
```

- `npm run lint` is declared (`next lint`) but **ESLint is not installed and there is no config** — it will fail. Don't rely on it; use `npx tsc --noEmit` for type checking.
- No test suite exists. Verification = `npm run build` + `tsc` + manual checks.

## Environment & DB gotchas

- `.env.local` is gitignored; the repo only ships `.env.example`. Copy it, fill `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`.
- **Two connection strings, non-interchangeable**:
  - `DATABASE_URL` — Supabase Transaction pooler (port **6543**, `?pgbouncer=true`). Used at runtime.
  - `DIRECT_URL` — direct (port **5432**). Used by `prisma db:push` / migrations. `schema.prisma` wires it via `directUrl`.
  - To migrate/seed production in one shot, override `DATABASE_URL` with the direct URL: `DATABASE_URL="<direct url>" npm run db:push`.
- `AUTH_SECRET` must be ≥ 16 chars or `session.ts` throws at runtime.
- `prisma/supabase-init.sql` is a hand-maintained idempotent bootstrap (schema + seed) for pasting into the Supabase SQL Editor — an alternative to `db:push`+`db:seed`. Keep it in sync when the schema changes.
- First login to `/admin/login` bootstraps an ADMIN from `ADMIN_EMAIL`/`ADMIN_PASSWORD` **only when the users table is empty**.

## Architecture & control flow

- **Public site is the legacy static site**: `/` redirects to `/legacy/index.html`. Everything under `public/legacy/**` is served verbatim and uses **relative paths** (`assets/...`) — preserve them during the Phase 2 migration. `tsconfig.json` excludes `public/legacy`.
- **CMS lives at `/admin`**:
  - `src/middleware.ts` guards everything under `/admin` (except `/admin/login`) using the edge-safe JWT cookie `kpd_session` (jose HS256, 7-day TTL). The middleware does NOT check the user still exists in the DB; server components/actions re-verify via `requireSession()` (`src/lib/auth.ts`), which redirects to login.
  - Authenticated area is a route group `src/app/admin/(dashboard)/` with a shared layout that renders nav, shows the session user, and defines an inline `logout` server action.
  - **There is no role-based authorization**: `requireSession()` only checks authentication. Any session (EDITOR or ADMIN) can do everything.
- **Server Actions are the mutation layer**: colocated `actions.ts` files under each route group, marked `"use server"`. Pattern: client component forms (`"use client"`) use `useActionState`; actions read `FormData`, return `{ error?: string }` state, then `revalidatePath(...)` + `redirect(...)` on success. Destructive actions (delete) use plain `<form action={action}>` with hidden `id` inputs. Follow this pattern for new CRUD.
- **Plumbing**:
  - `src/lib/db.ts` — global singleton PrismaClient (dev hot-reload safe).
  - `src/lib/session.ts` — edge-safe JWT helpers (importable from middleware; no Node-only deps).
  - `src/lib/rss.ts` — RSS ingest (Google News RSS + GDELT), regex/string parsed (no feed library). Keyword list (`matchTerms`, `keywordLabels`) is defined here — extend it here.
  - `src/lib/salesforce.ts` — OAuth2 password-grant + Lead create; caches `instanceUrl` in a module variable (mind serverless cold starts). Throws when unconfigured.
  - `src/lib/r2.ts` — Cloudflare R2 upload/delete/public-URL helpers.
- **RSS pipeline**: Vercel Cron (`vercel.json`, every 30 min) → `GET /api/cron/rss-ingest` (Bearer `CRON_SECRET`) → inserts PENDING `RssItem`s (dedupe by URL) → admin reviews (`/admin/rss`): approve creates a PUBLISHED Article inside a `$transaction`, reject marks REJECTED.
- **Contact form dual-write**: `POST /api/contact` always persists a `ContactSubmission` locally first, then mirrors to Salesforce as a Lead. Salesforce failure marks the row `FAILED` with `syncError` but still returns 201 — locals-first is intentional; there is NO retry job yet (admin `/submissions` shows failed syncs).
- **Public API**: `GET /api/articles` (published only, `kind=NEWS|BLOG`, `limit` capped at 100, `publishedAt desc`). DB-failure paths return a graceful 503 (pattern set in commit dc0f50b) — keep that behavior.

## Data model (prisma/schema.prisma)

- All camelCase fields map to snake_case tables via `@@map`. All enums are Postgres enums (`UserRole`, `ArticleKind`, `ContentStatus`, `ProjectProfile`, `ModuleKind`, `RssItemStatus`, `SubmissionStatus`). Use `db:push` after edits.
- JSON columns are the flexible-content workhorse: `Article.body` = `string[]` of paragraphs; `ProjectModule.content` = freeform object; `StaticPage.content` = ordered blocks. Translation rows (`*Translation` models, `locale: "en"|"ar"|"ja"`, `@@unique([parentId, locale])`) are seeded by the client later — AR/JA content is not supplied yet.
- `Article.sourceRssItemId` links an article back to the RSS item that produced it (`@unique` → one-to-one).

## Conventions & style

- **No Tailwind** (despite `postcss.config.mjs`): it is intentionally empty to stop Next from picking up a parent-folder Tailwind config, and `next.config.mjs` pins `outputFileTracingRoot` for the same reason. Styling is plain CSS: `src/app/globals.css` (public) and `src/app/admin/admin.css` with a `cms-*` class prefix. Match that for the admin; use globals.css classes for the future public pages.
- Path alias `@/*` → `./src/*`.
- Codebase conventions to match: `///` doc comments, box-drawing `──` section dividers in lib files, `export type XxxFormState = { error?: string }` for action state, local `slugify()` helper (defined per-file in `actions.ts`, not shared).
- `package.json` uses a nonstandard `allowScripts` map (npm allow-scripts tooling) — keep it in sync when dependency versions bump.

## Gotchas

- `publishedAt` is set to `new Date()` whenever an article is saved with status PUBLISHED (even a re-save of an already-published article rewrites the date).
- Slug collisions surface as raw Prisma "Unique" errors — map them to friendly messages (existing pattern in `saveArticle`).
- Article body accepts blank-line-separated plain text OR a JSON array of strings (`parseBody` in admin actions).
- RSS slugs are generated as `rss-<timestamp>-...` — safe from collision for RSS-created articles.
- Google News/GDELT parsing is regex/string based and will break silently on feed format changes; wrap new sources in the same Promise.allSettled pattern in `ingestFeeds`.
- The seed uses `upsert(... update: {} ...)` — safe to re-run, but existing rows (incl. `publishedAt`) are never touched.