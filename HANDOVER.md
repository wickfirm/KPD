# KPD — Session handover (2026-10-10)

Read `AGENTS.md` first (architecture, commands, gotchas). This file is the state of play at the end of a long session. Everything below is **pushed to `main`** (last commit `e82b834`) unless marked otherwise.

## Working setup (read before touching anything)

- Work in the worktree `…/KPD/.claude/worktrees/legacy-page-styling-7e559e` (branch `claude/legacy-page-styling-7e559e`). Push with `git push origin HEAD:main` **only when the user says so** (they say "push"). Fast-forward only; `main` has had no other writers.
- The worktree has **no `node_modules` and no `.env.local`**. To build/test, temporarily: `Copy-Item ..\..\..\.env.local .env.local`, junction `node_modules` to the main checkout's (`New-Item -ItemType Junction -Path node_modules -Target …\KPD\node_modules`), run, then **remove both** (`cmd /c rmdir node_modules`, delete `.env.local`). Both are gitignored.
- Local `DATABASE_URL` credentials are rejected ("tenant/user not found"): DB-backed routes (`/developments/*`, `/news/[slug]`, legal pages, the admin) cannot render locally. Pages with a DB try/catch fall back to code defaults. Production DB = Supabase project `kpd-mena` (id `zgznesicqtoftkqrcjte`, readable with the Supabase MCP `execute_sql`; never write without being asked).
- Verification habit that worked: `npx tsc --noEmit`, `npx vitest run` (43 tests), `npx next build`, plus rendering real components with `tsx` + `renderToStaticMarkup`, and static HTML harnesses served by `python -m http.server` and viewed in the browser pane. `gh` CLI is not installed (no PRs; direct pushes to `main`). curl/wget are blocked by a hook; use the context-mode `ctx_execute` fetch.
- Windows: files are CRLF/BOM in places. Edit with Python helpers that preserve line endings (see `%TEMP%\pytools\ed.py` if it still exists; otherwise rewrite). Beware `\b`/`\n` escapes inside Python strings that hold TS regex.
- Prod deploys on push to `main` (Vercel project `kpd`, team `wickfirms-projects`). Public pages revalidate every 300 s; admin saves bust the cache.

## Source of truth

`public/legacy/**` (client-delivered HTML/CSS/JS) is the visual source of truth. **Never change copy**; CSS/markup parity only. `site-cms.js` is a copy of delivered `site.js` with documented patches (menu image base path, contact details from settings, structured enquiries). Bump the `?v=` in `src/components/public/delivered-scripts.tsx` whenever it changes (currently `20261009-structured-enquiries`).

## What was done this session

**Public front-end parity**
- Legacy timeline: cards without body copy never initialised (script bails without `.legacy-timeline-body`) — wrapper always rendered. The 420 px media minimum is delivered behaviour.
- Delivered script now runs **during parse** (`DeliveredEarlyScripts`) on `/legacy`, `/`, `/about`, `/contact`, `/invest-in-dubai`, `/news`; listeners from each run are tracked and released on soft navigation. **Not applied** to `/developments/[slug]`, `/news/[slug]`, legal `[slug]` (couldn't test locally) — still post-hydration.
- Development pages: `RawFigure` removes the wrapper `<div>` around directional figures; per-project enquire band; menu background images no longer 404 (`getMenuImageUrl` resolves against `/legacy/`); content blueprints fixed; hero titles were hidden behind the header (extra rule `top:auto` in `src/app/(public)/public.css`). All three pages now match delivered markup section-by-section (only intentional diffs: pre-rendered planner, one wrapper div around the location shell).
- Shared `DevelopmentView` (public page + admin draft preview).

**Production data (already applied by the user via SQL)**
- `prisma/refresh-legacy-modules.sql` (generator `scripts/generate-refresh-sql.ts`) reconciled the three projects' modules with the delivered content; backups in `project_modules_backup_20261009`, `projects_backup_20261009`.
- Fixed CRLF leakage in taglines/titles (user ran the cleanup UPDATE).

**CMS wiring (public ↔ admin)**
- Site settings now drive footer links/newsletter, floating Enquiry/Call/WhatsApp, booking form (`src/lib/site-contact.ts`, `window.__KPD_CONTACT`). Social fields added.
- Contact page: empty saved settings no longer blank the phone/email links.
- Home: key figures, banner slides, development cards editable (`home-defaults.ts`, `ListEditor`).
- Invest in Dubai: every section editable (`invest-defaults.ts`, `pages/invest-form.tsx`, `"invest"` block in the `invest-in-dubai` static page). With nothing saved, HTML is byte-identical to the old hard-coded page.
- New CMS-created projects publish via `genericProjectShell` (no 404).
- Fixed pages (About/Legacy/Contact/Invest/legal) can no longer have their slug changed (`applyStaticPage` ignores it; About slug input locked). Status select hidden for pages that are live from code defaults; legal pages stay DRAFT = serve the static delivered file until published.
- Removed unused hero CTA fields. Legacy editor rebuilt on `ListEditor` (full-width cards).

**Submissions**
- `contact_submissions` gained `inquiryType` (text) and `details` (JSONB `[{label,value}]`); Contact form sends per-pane fields; booking/floor-plan/newsletter forms send structured details via `site-cms.js`; Salesforce gets message + details; Messages page = expandable cards with type/status filters. API falls back to the old columns if the migration isn't applied. **User must have run:** `ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS "inquiryType" TEXT; … "details" JSONB;` (+ optional backfill `UPDATE … SET "inquiryType"=split_part(interest,': ',1)`). Confirm with a test submission.

**Admin UX (consistent pattern)**
- Developments: card grid, search/status filters, Preview for any status (`/admin/preview/developments/[slug]`), More menu (Publish/Unpublish/Archive/Restore/Duplicate/Move), starter sections for new projects (`src/lib/project-starter.ts`), editor with sticky section nav, header Publish/Archive, Move up/down for sections, unsaved-changes bar, plain-language labels (advanced options folded away). Archive/Unpublish are immediate (user decision).
- Shared: `EditorShell` (`AutoSectionNav` from headings + `UnsavedGuard`) on Homepage, About, static pages, Invest, Calculator, Site settings, article editors; row-card News & Blog list with status actions; Pages grouped (Website/Legal); Team cards; Media search + type filter; News inbox review cards; Calculator rows aligned; ghost/outline/danger buttons fixed globally (compound selectors at end of `admin.css`).

## Open items / next steps (priority order)

1. **User is mid sign-off, page by page.** Signed off: Homepage, About (slug fix done), Legacy back-end. Still to test: Invest in Dubai editor, Contact, Terms/Privacy/Cookie, Developments content, Calculator, News/articles, Settings, Messages, Team, Media. Fix whatever they report; they like the new list/editor pattern and asked for it everywhere (done in `e82b834` — confirm it looks right live).
2. **Verify on production after the last deploys** (none of the admin saves were tested end-to-end — no admin login available in-session): save Homepage, Site settings, Investor guide once; submit one enquiry per form type and check Messages; create → publish → archive → restore a test development; article Publish/Duplicate. Run the status SQL if not done: `UPDATE static_pages SET status='PUBLISHED' WHERE slug IN ('about','legacy','contact','invest-in-dubai');`.
3. **React hydration warning #418** on `/developments/*` in production only (not on /about or /invest). Dev-mode hydration of old vs new components was clean, so cause unknown (suspect `renderPlannerHtml`/`dangerouslySetInnerHTML` mismatch or video/script differences). Page still ends with all sections; investigate with a dev build against a working DB.
4. Apply `DeliveredEarlyScripts` to developments / news article / legal pages once testable (needs a working DB or preview deploy).
5. Not built: drag-and-drop image reorder with captions, true live preview of unsaved changes, draft preview for articles, preview for static pages; map URL/hero video/overview image for CMS-created projects are fixed in code (map field only meaningful for generic shell); header mega-menu content is hard-coded.
6. Roadmap the user asked for ("2027 CMS"): shared UI primitives (`src/components/ui` underused; most screens still hand-rolled `cms-*` CSS), command palette, dark mode via tokens, accessibility pass, roles/permissions (any EDITOR can do everything except ADMIN-only settings/team/activity).
7. Housekeeping: `main` working copy at `…/KPD` has untracked `CLAUDE.md` and `KPD Content Review/Feedback/`. `prisma/supabase-init.sql` was updated for the new columns. The earlier lint warnings (`<img>` etc.) are pre-existing and set to warn.

## Key files

- Public: `src/components/public/{delivered-scripts,delivered-body-class,development-page,development-view,development-template,raw-figure,home-page,about-page,legacy-page,contact-inquiry,site-shell-*}.tsx`, `src/app/(public)/invest-in-dubai/page.tsx`, `src/lib/{legacy-project,legacy-project-templates,invest-defaults,home-defaults,site-contact,submissions}.ts`.
- Admin: `src/app/admin/(dashboard)/actions.ts` (all server actions; ~900 lines), `projects/`, `pages/`, `submissions/`, `articles/`, `src/components/admin/{list-editor,editor-shell,auto-section-nav,section-nav,unsaved-guard}.tsx`, `src/app/admin/admin.css` (new rules are appended at the end, in labelled blocks).
- Tools in repo root: `diff-projects.mjs`, `compare-pages.mjs` (delivered-vs-live comparisons), `scripts/refresh-legacy-modules.ts`, `scripts/generate-refresh-sql.ts`.

## Decisions the user made

Delivered files are the source of truth; no copy changes. Archive removes a development from the site immediately. Fixed pages keep their slug. Push/merge only on explicit "push".
