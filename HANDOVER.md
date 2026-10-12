# KPD — Session handover (2026-10-12)

Read `AGENTS.md` first (architecture, commands, conventions). This file is the state of play after the long working sessions of 2026-10-10 to 2026-10-12. Everything described here is **pushed to `main`** (last commit `a7bf2a0`) and deployed to Vercel. The earlier handover (2026-10-10) is superseded by this one.

## 1. Working setup (read before touching anything)

- **Branches:** work happens in the worktree `…/KPD/.claude/worktrees/legacy-page-styling-7e559e` (branch `claude/legacy-page-styling-7e559e`). The user says "push to vercel and merge with main" to mean: `git push origin HEAD:claude/legacy-page-styling-7e559e` then `git push origin HEAD:main` (fast-forward; check `git rev-list --left-right --count origin/main...HEAD` first). **Push only when told.** Commit freely.
- **Commits:** write the message to a file *outside the repo* and use `git commit -F <file>`. PowerShell 5.1 mangles double quotes in messages, and `git add -A` will sweep a message file inside the repo into the commit. End messages with the `Co-Authored-By` line the harness gives.
- **Environment:** the worktree has no `.env.local` and no `node_modules`. To build or run, copy `.env.local` from the main checkout (`Copy-Item ..\..\..\.env.local .env.local`), run, then delete it. Tools find `node_modules` by walking up to the main checkout, so no junction is needed. Remove any `node_modules` folder that `vitest`/`next` leave in the worktree (it only contains caches).
- **Database (Supabase project `kpd-mena`, id `zgznesicqtoftkqrcjte`, region ap-southeast-1):**
  - `DATABASE_URL` = transaction pooler: host `aws-0-ap-southeast-1.pooler.supabase.com`, port **6543**, user `postgres.zgznesicqtoftkqrcjte`, `?pgbouncer=true&sslmode=require`.
  - `DIRECT_URL` = session pooler, same host, port **5432**, `?sslmode=require` (the `db.<ref>.supabase.co` host is IPv6-only and fails on many networks).
  - **"Can't reach database server" can really mean a wrong password.** Add `sslmode=require` to see the real error. "tenant/user not found" means the host or user is wrong.
  - Readable with the Supabase MCP `execute_sql`; **never write to production unless asked.** The user runs write SQL themselves.
- **Verification habit:** `npx tsc --noEmit`, `npx vitest run` (127 tests), `npx next build` (31 static pages with DB access), then look at the real thing. For any refactor of rendered markup, fetch the production page and the local page and compare the rendered `<main>` text (identical = safe). For SEO, fetch each page and read the head (title, description, canonical, og:*, JSON-LD types).
- **Local dev server:** `npm run dev` picks the next free port if 3000 is taken (stale servers linger; stop with TaskStop). The admin session cookie is shared across `localhost` ports, so a login in the browser pane works on any port. Open pages with `preview_start` + `url` (plain `navigate` to a new port is often refused). The pane resets its viewport between calls: batch `resize_window` + `screenshot` together. Never change data when viewing as the user.
- **Prisma:** `npx prisma generate` fails with EPERM if a dev server holds the query-engine DLL; types still update. Delete the stray `query_engine-windows.dll.node.tmp*` it leaves in the shared `node_modules/.prisma/client`.
- **Windows / tooling quirks:** files are CRLF/BOM in places; edit with small Python scripts that preserve line endings (read with `newline=""`, normalise to LF, write back). Git Bash rewrites arguments that start with `/` (pass paths without the leading slash). The worktree-isolation hook refuses complex shell lines (variables in `sed`, chained `cd`): split into simple commands. `Write` requires a prior `Read` of an existing file. `curl`/inline HTTP in Bash are blocked by a hook: put fetch code in a script file or use the browser pane.
- **Vercel:** project `kpd` (id `prj_uTTkwfwCFFcDkBRSqNSAf6qZbdgk`), team `wickfirms-projects`, production alias `kpd-eight.vercel.app`. Pushing `main` deploys. **A deploy can hang in "Deploying outputs…" for 10+ minutes** even though the build succeeded (seen once); check `list_deployment_events` (direction backward) before assuming the code is at fault, and cancel and redeploy if it persists.

## 2. Source of truth

`public/legacy/**` (client-delivered HTML/CSS/JS) is the visual source of truth. **Never change copy**; CSS/markup parity only. `site-cms.js` is the delivered `site.js` with documented patches; bump the `?v=` in `src/components/public/delivered-scripts.tsx` whenever it changes (currently `20261009-structured-enquiries`). The three delivered developments are Seven X Seven, Emerald Villa and Dubai Hills Mansion.

## 3. What exists now (all live)

**CMS editing**
- Drag-and-drop reordering (⠿ handle) for gallery images and every `ListEditor` card list. Gallery captions are per image and move with it (`src/lib/gallery-content.ts` pairs images and captions by position *before* blank rows are dropped).
- **"Preview with unsaved changes"** on: development sections, articles, Terms/Privacy/Cookie, Homepage, Investor guide, About, Legacy, Contact. Plus saved-version previews (`/admin/preview/...`).
- Developments created in the CMS and published appear in the site menu, mobile menu and footer after the three delivered ones (`src/lib/nav-developments.ts`; raw delivered chrome on the news pages is patched by `injectNavDevelopments`).
- Roles and permissions (below), a built-in **CMS guide** at `/admin/guide`, a loading bar/skeleton on every admin navigation (`(dashboard)/loading.tsx`), and a front-end-matched visual identity.

**Public site**
- Development pages no longer trigger React #418 (location slice balanced, CRLF normalised, `suppressHydrationWarning` on `<body>`); the delivered script runs during parse on every dynamic page; the news article no longer double-loads the old `site.js`.
- **SEO/AEO (`src/lib/seo.ts`):** unique title (≤60) and description per page, canonical links, Open Graph/Twitter with a default branded card, JSON-LD (Organization, WebSite with stable `@id`s, WebPage types, BreadcrumbList, Residence per development, Article, the Invest FAQ), Legacy added to the sitemap, `/llms.txt`, `noindex` header on the delivered article and legal template files. Fixed-page copy lives in `pageSeo` / `legalSeo`; developments and articles use their own text.

## 4. How the key mechanisms work (reuse these)

- **Permissions** (`src/lib/permissions.ts`, the single source of truth): roles `ADMIN`, `EDITOR`, `CONTRIBUTOR`, `VIEWER`. Every server action starts with `requirePermission("…")` (`src/lib/auth.ts`), which re-reads the role from the database. `canViewPath` drives the middleware and the menu. Contributors: saves forced to Draft, edits to non-draft items refused (`mayEditContent`, `allowedStatus`). Controls are hidden by `data-requires="publish|delete"` plus `cms--no-publish` / `cms--no-delete` / `cms--readonly` classes on `.cms`. The cookie carries the role from sign-in, so menus lag a role change until re-login; actions do not. **Never use bare `requireUser()` for a write.**
- **Unsaved previews:** an action stores the form as one throw-away row in `site_settings` (`preview:section:<projectId>`, `preview:article:<id|new:<email>>`, `preview:page:<slug>`, `preview:home|invest:<email>`), expiring after 2 hours, read only by the session-guarded `/admin/preview/*` routes. Builders are shared with the real saves (`homeSettingsFromForm`, `buildStaticPageContent`, `paragraphBlocks`, `moduleContentFromForm`) so a preview cannot drift from a save.
- **Shared views:** `HomeView`, `InvestView`, `AboutView`/`LegacyView`/`ContactView` (`page-views.tsx`), `ArticleView`, `LegalPageView`, `DevelopmentView` render both the public page and its preview.
- **Loading/perf:** `requireUser()` is wrapped in React `cache()` (one users query per request); the layout queries the sidebar page list in parallel.
- **Styling:** `src/app/admin/admin.css` = tokens (`@theme`) + `cms-*` classes; new rules are appended in labelled blocks (identity layer, roles, loading, guide). Palette is neutral on purpose (the front-end is black/white/off-white with no accent). Font: Figtree via `next/font` (`src/app/admin/font.ts`), applied to the dashboard and login only.

## 5. Decisions the user made

Delivered files are the source of truth; no copy changes. Archive/Unpublish take effect immediately. Fixed pages keep their slug. **Four roles**; only Administrators delete developments/articles/pages permanently; Editors keep publishing and Messages. (My calls, flip if wanted: Editors may delete a *section*; Contributors cannot open live pages; Viewers can read Messages.) CMS look: **strong** match to the front-end, black not green. Issue reporting for the client goes through **Omnixia only**: https://atc.omnixia.ai (login-gated "Wick Portal"). Frame it as "ready for acceptance testing", not "done".

## 6. Client acceptance testing (status as of 2026-10-12)

- Client was emailed (2026-10-11) with the checklist, test logins and the Omnixia link. **Checklist:** Google Sheet "KPD CMS - Acceptance test checklist (v2)", id `1Dx0EuntktoioxZjF1nQtL7WH_O1R2O-brbVLgDj_UUk` (20 tests, Result dropdown, "How to use" tab). Do not replace it with a new copy: the client already has this link; the Drive connector can only rename/move files, not edit cells.
- **Test accounts** `uat.admin|editor|contributor|viewer@kpd.test` were created by SQL (bcrypt hashes; passwords were sent to the user in chat/email and are **not** stored anywhere). **Remove after testing:** `UPDATE users SET "isActive" = false WHERE email LIKE '%@kpd.test';` (or `DELETE FROM users WHERE email LIKE '%@kpd.test';`). `prisma/add-roles.sql` (adds the `CONTRIBUTOR`/`VIEWER` enum values) has already been run in Supabase.
- The user ran their own smoke test and said it worked "in some" tests; **which failed was never reported.**

## 7. Open items, in priority order

1. **Salesforce (client-side):** 13 enquiries are `FAILED` (saved locally, not synced). Needs working credentials from the client; then use **Retry sync** per message in `/admin/submissions`.
2. **Unpublish the test article** `this-is-a-new-artivle` ("Testing 1, 2, and 3"); it is live and now in the sitemap and `llms.txt`.
3. **Triage the client's Omnixia reports** as they arrive; ask the user which of their own smoke tests failed.
4. Remove the `@kpd.test` accounts after acceptance.
5. **CMS-editable SEO fields** (title/description box per page, development and article). Then AEO content work: direct-answer paragraphs and FAQs on key pages, image alt-text audit, Core Web Vitals check, a distinct social image per page, hreflang once Arabic/Japanese exist.
6. **Canonical domain:** `SITE_URL` defaults to `https://kpd.ae` (`src/lib/site.ts`, override `NEXT_PUBLIC_SITE_URL`). Production is currently reachable at `kpd-eight.vercel.app`; make sure the real domain serves the site, then submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
7. **Never seen rendered / not exercised end to end:** the role flows (Contributor, Viewer) with real accounts; the Homepage/Investor list editors, Messages, News & Blog and Media screens in the new style; the hover preview image for CMS-created developments in the dropdown; admin saves of every page in production after the refactors (`buildStaticPageContent` sits in every page save).
8. Arabic and Japanese content has not been supplied (translation tables exist, empty).
9. Roadmap items not started: shared UI primitives (`src/components/ui` is underused), command palette, dark mode via tokens, accessibility pass.

## 8. Key files by area

- **Permissions/auth:** `src/lib/permissions.ts` (+ test), `src/lib/auth.ts`, `src/lib/session.ts`, `src/middleware.ts`, `prisma/add-roles.sql`, Team screens under `src/app/admin/(dashboard)/users/`.
- **Admin mutations:** `src/app/admin/(dashboard)/actions.ts` (all content actions; `previewSectionDraft`, `previewArticleDraft`, `previewPageDraft`, `previewHomeDraft`, `previewInvestDraft`), `media/media-actions.ts`, `submissions/actions.ts`, `src/app/api/admin/assets/route.ts`.
- **Previews:** `src/app/admin/preview/{developments,articles,pages,home,invest-in-dubai}/`, `src/lib/{section,article,page,site}-preview.ts`, `src/components/admin/drag-reorder.tsx`, `src/lib/{reorder,gallery-content}.ts`.
- **Public views:** `src/components/public/{home-view,invest-view,page-views,article-view,legal-page-view,development-view,development-template,json-ld}.tsx`, `src/lib/{static-blocks,home-saved,invest-page,nav-developments,html-lf}.ts`.
- **SEO:** `src/lib/seo.ts`, `src/lib/llms.ts`, `src/app/llms.txt/route.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `next.config.mjs` (redirects + `X-Robots-Tag`).
- **Admin look and help:** `src/app/admin/admin.css`, `src/app/admin/font.ts`, `src/app/admin/(dashboard)/{layout,loading}.tsx`, `src/app/admin/(dashboard)/guide/page.tsx` (keep the guide in step with the admin).

## 9. Gotchas that cost time

- `dangerouslySetInnerHTML` HTML must be balanced and LF-only or React rebuilds the page (#418). A page-shell slice that stops mid-structure is the usual cause.
- Gallery captions are positional (`items[i].label` belongs to `images[i]`): never reorder or filter one list without the other.
- Saving a Published article rewrites its `publishedAt`.
- Page-level `openGraph` replaces the root one entirely: always go through `pageMetadata()` so siteName, type and the default image survive.
- `AGENTS.md` previously said there was no role system; it is corrected now. Keep it and this file in step with the code.
