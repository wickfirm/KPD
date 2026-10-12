# AGENTS.md

KPD (Kasumigaseki Properties Development) — Next.js 15 website + ground-up custom CMS. The CMS is feature-complete and in client acceptance testing; the public design is the delivered static site (`public/legacy`) ported to React. **Read `HANDOVER.md` for the current state, working setup, decisions and open items.** See README.md for the contract-scope map.

## Commands

```bash
npm install            # postinstall runs `prisma generate` automatically
npm run dev            # http://localhost:3000
npm run build          # prisma generate && next build
npm start              # production server (after build)
npm run lint           # ESLint 9 (flat config, eslint-config-next ^15.5)
npm test               # Vitest — unit tests for lib/ pure logic
npm run db:push        # Prisma schema sync — uses DIRECT_URL (see DB gotchas)
npm run db:seed        # tsx prisma/seed.ts — idempotent articles/projects/pages
npm run db:studio      # Prisma Studio
```

- `npm run lint` uses `eslint-config-next@^15.5.0` — **do not bump it to v16** (flat-only; crashes under FlatCompat). 3 rules with pre-existing debt are set to `warn` (documented in `eslint.config.mjs`).
- Verification = `npm run build` + `tsc --noEmit` + `npm test` + looking at the real page. When refactoring rendered markup, compare the rendered `<main>` of local and production; for SEO, read each page's head. `compare-render.mjs` diffs old-vs-new rendered DOM for pixel-fidelity regressions (captures in %TEMP%). `node markup-parity.mjs <base-url>` compares the client's delivered HTML in `public/legacy` with a running site (elements, class names, stylesheets, body classes); run it after any change to public markup.

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

- **Public pages are React ports of the delivered design** (pixel-identical, DOM-diff verified): `/`, `/about`, `/legacy`, `/developments/*` render CMS content as React components (`src/components/public/*-page.tsx`) inside a **delivered shell** — `src/lib/legacy-*.ts` now only *extract* the shell (header/menu/booking/footer verbatim, links routed, asset paths rewritten to `/legacy/assets/`). Canonical delivered copy lives in `src/lib/*-defaults.ts` (single source of truth shared with admin editors). Delivered `site.js` is re-attached per page via `*-page-scripts.tsx` components (innerHTML scripts never execute). Everything under `public/legacy/**` is still served verbatim. **`public/legacy/assets/css/site.css` must stay byte-for-byte as delivered (no BOM, LF)**: CMS-era calculator styles live in `ownership-planner-top.css` (loaded before it) and `ownership-planner-end.css` (loaded after it), both imported by `src/app/(public)/public.css` in that order so the cascade is unchanged. Put new CMS-only CSS in `public.css` or a new file, never in `site.css`. This is enforced: `scripts/check-delivered-css.mjs` (the `prebuild` step, and `src/lib/delivered-css.test.ts`) fails if `site.css` differs from the hash in `scripts/delivered-css.sha256`; if the client ever supplies a new stylesheet, replace the file and update the hash with `node scripts/check-delivered-css.mjs --print-hash`. Figtree is also served from `/legacy/assets/fonts` (`figtree-local.css`) so pages do not fall back to Arial when Google Fonts is blocked. `tsconfig.json` excludes `public/legacy`.
- **CMS lives at `/admin`**:
  - `src/middleware.ts` guards everything under `/admin` (except `/admin/login`) using the edge-safe JWT cookie `kpd_session` (jose HS256, 7-day TTL). The middleware does NOT check the user still exists in the DB; server components/actions re-verify via `requireSession()` (`src/lib/auth.ts`), which redirects to login.
  - Authenticated area is a route group `src/app/admin/(dashboard)/` with a shared layout that renders nav, shows the session user, and defines an inline `logout` server action.
  - **Roles and permissions** (`src/lib/permissions.ts`, single source of truth): ADMIN, EDITOR, CONTRIBUTOR, VIEWER. Every server action starts with `requirePermission("<permission>")` (`src/lib/auth.ts`), which re-reads the user's role from the database, so a role change applies immediately; the middleware only fast-rejects screens by the role in the cookie (`canViewPath`). Contributors are limited to drafts (`mayEditContent`/`allowedStatus`). When adding an action, pick its permission there; do not use bare `requireUser()` for a write. New roles need `prisma/add-roles.sql` run once in Supabase.
  - **Unsaved-changes previews**: editors post their form to a `preview*Draft` server action, which stores a throw-away `site_settings` row (`preview:*`, 2 h expiry) read only by the session-guarded `/admin/preview/*` routes. Page markup lives in shared view components (`HomeView`, `InvestView`, `page-views.tsx`, `ArticleView`, `LegalPageView`, `DevelopmentView`) so the public page and its preview are the same code; the form-to-content builders are shared with the real saves so they cannot drift.
  - **Admin navigation feel**: `(dashboard)/loading.tsx` shows a bar and skeleton instantly; `requireUser()` is `cache()`d per request.
- **SEO / AEO**: all page metadata goes through `pageMetadata()` in `src/lib/seo.ts` (titles <= 60, descriptions <= 160, canonical, Open Graph/Twitter with a default card); fixed-page copy is in `pageSeo` / `legalSeo`; JSON-LD helpers and `<JsonLd/>` live beside it. `/llms.txt` is built from the same data. Never set a bare `openGraph` in a page: it replaces the root one. Editors can override a page's, development's or article's search title/description from the "Search appearance" box; overrides are `site_settings` rows `seo:<page|project|article>:<slug|id>` (`src/lib/seo-overrides.ts`, `src/lib/seo-store.ts`), saved by `saveSeoFor()` in the admin actions and applied in each page's `generateMetadata`.
- **Server Actions are the mutation layer**: colocated `actions.ts` files under each route group, marked `"use server"`. Pattern: client component forms (`"use client"`) use `useActionState`; actions read `FormData`, return `{ error?: string }` state, then `revalidatePath(...)` + `redirect(...)` on success. Destructive actions (delete) use plain `<form action={action}>` with hidden `id` inputs. Follow this pattern for new CRUD.
- **Plumbing**:
  - `src/lib/db.ts` — global singleton PrismaClient (dev hot-reload safe).
  - `src/lib/session.ts` — edge-safe JWT helpers (importable from middleware; no Node-only deps).
  - `src/lib/rss.ts` — RSS ingest (Google News RSS + GDELT), regex/string parsed (no feed library). Keyword list (`matchTerms`, `keywordLabels`) is defined here — extend it here.
  - `src/lib/salesforce.ts` — OAuth2 password-grant + Lead create; caches `instanceUrl` in a module variable (mind serverless cold starts). Throws when unconfigured.
  - `src/lib/r2.ts` — Cloudflare R2 upload/delete/public-URL helpers.
- **RSS pipeline**: Vercel Cron (`vercel.json`, every 30 min) → `GET /api/cron/rss-ingest` (Bearer `CRON_SECRET`) → inserts PENDING `RssItem`s (dedupe by URL) → admin reviews (`/admin/rss`): approve creates a PUBLISHED Article inside a `$transaction`, reject marks REJECTED.
- **Contact form dual-write**: `POST /api/contact` always persists a `ContactSubmission` locally first, then mirrors to Salesforce as a Lead. Salesforce failure marks the row `FAILED` with `syncError` but still returns 201 — locals-first is intentional. There is no *automated* retry job, but admin `/submissions` has a per-row **Retry sync** action (`submissions/actions.ts` → `retrySubmissionSync`, audits as `submission.retry`) for replaying NEW/FAILED rows once Salesforce credentials are configured; retries use the same bounded-timeout `pushLeadToSalesforce`.
- **Public API**: `GET /api/articles` (published only, `kind=NEWS|BLOG`, `limit` capped at 100, `publishedAt desc`). DB-failure paths return a graceful 503 (pattern set in commit dc0f50b) — keep that behavior.

## Data model (prisma/schema.prisma)

- All camelCase fields map to snake_case tables via `@@map`. All enums are Postgres enums (`UserRole`, `ArticleKind`, `ContentStatus`, `ProjectProfile`, `ModuleKind`, `RssItemStatus`, `SubmissionStatus`). Use `db:push` after edits.
- JSON columns are the flexible-content workhorse: `Article.body` = `string[]` of paragraphs; `ProjectModule.content` = freeform object; `StaticPage.content` = ordered blocks. Translation rows (`*Translation` models, `locale: "en"|"ar"|"ja"`, `@@unique([parentId, locale])`) are seeded by the client later — AR/JA content is not supplied yet.
- `Article.sourceRssItemId` links an article back to the RSS item that produced it (`@unique` → one-to-one).

## Conventions & style

- **Styling is hand-written CSS.** Public pages: `src/app/globals.css` and the delivered `public/legacy/assets/css/site.css` (+ `src/app/(public)/public.css`). Admin: `src/app/admin/admin.css`, which declares its design tokens in a Tailwind v4 `@theme` block but is styled with `cms-*` classes; append new rules in labelled blocks at the end. `postcss.config.mjs` is intentionally empty and `next.config.mjs` pins `outputFileTracingRoot` so Next does not pick up a parent-folder Tailwind config. The admin palette is deliberately neutral (black / white / off-white) to match the front-end; keep status colours semantic only.
- Path alias `@/*` → `./src/*`.
- Codebase conventions to match: `///` doc comments, box-drawing `──` section dividers in lib files, `export type XxxFormState = { error?: string }` for action state, local `slugify()` helper (defined per-file in `actions.ts`, not shared).
- `package.json` uses a nonstandard `allowScripts` map (npm allow-scripts tooling) — keep it in sync when dependency versions bump.

## Gotchas

- `publishedAt` is set to `new Date()` whenever an article is saved with status PUBLISHED (even a re-save of an already-published article rewrites the date).
- Slug collisions surface as raw Prisma "Unique" errors — map them to friendly messages (existing pattern in `saveArticle`).
- Article body accepts blank-line-separated plain text OR a JSON array of strings (`parseBody` in admin actions).
- Headings that his HTML breaks over two lines (homepage intro/developments/contact headings, a development's Headline, a section title, page hero headings) are `<textarea>`s: a line break becomes `<br>` on the page (`multiline()` in the views). Never make such a field a single-line `<input>` (browsers drop the newline from its value). `normalizeLineBreaks()` (`src/lib/line-breaks.ts`) tidies the text on save.
- RSS slugs are generated as `rss-<timestamp>-...` — safe from collision for RSS-created articles.
- Google News/GDELT parsing is regex/string based and will break silently on feed format changes; wrap new sources in the same Promise.allSettled pattern in `ingestFeeds`.
- The seed uses `upsert(... update: {} ...)` — safe to re-run, but existing rows (incl. `publishedAt`) are never touched.