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
5. ~~CMS-editable SEO fields~~ built on branch `claude/cms-seo-fields` (2026-10-12): a "Search appearance (SEO)" box in the Homepage, About, Legacy, Contact, Investor guide, legal page, development and article editors. Stored as `site_settings` rows `seo:page:<slug>` / `seo:project:<id>` / `seo:article:<id>` (no schema change); read via `src/lib/seo-store.ts`, logic in `src/lib/seo-overrides.ts`. The News listing page has no editor, so its SEO stays in code. Next, AEO content work: direct-answer paragraphs and FAQs on key pages, image alt-text audit, Core Web Vitals check, a distinct social image per page, hreflang once Arabic/Japanese exist.
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

## 10. Client acceptance feedback round (Nov 2026)

Four rounds of CMS-editability feedback, all implemented and merged through the `cms-editability-feedback` branch (kept for rollback; last main `bc35136`):

- **Fixed-page heroes:** eyebrows on About/Legacy/Investor Guide/Contact are CMS fields (undefined = delivered label, empty = hidden).
- **Typography:** `src/lib/text-style.ts` gained numeric weights 300–800, `lineHeight`, and a mobile cap — every CMS font size renders as `min(size, 10vw)` (client-approved option A). Appearance groups exist on homepage sections, investor-guide sections (via `investJson`), About, development modules, and site-wide settings.
- **Homepage:** news + banner buttons have below/above/left/right position settings; banner content measure `min(1800px, 94%)`; as-of note is linkable (`statsNoteUrl`); key figures have value/caption appearance styles; hero accepts an image (poster for the video) and the video loops.
- **About:** philosophy image split from the hero (`storyImage`); chairman column capped ≥1440px so the portrait never crops.
- **Development pages:** `src/lib/directional-figure.ts` — CMS image list drives the delivered Meydan/calm sliders (`undefined` = delivered untouched, `[]` = figure removed; `moduleContentFromForm` stores `images: []` explicitly). Floor Plans and Payment Plan render Media uploads (cards / slider); every section button follows one rule: visible unless switched off, link → navigate, no link → booking form.
- **Legacy page:** end-of-page CTA (`legacyCtaLabel/Url/Visible`), defaults to https://map.kasumigaseki.ae/.
- **Footer:** every word editable in Site settings → Footer (blank keeps delivered wording).
- **seven-x-seven residence page (`/seven-x-seven`):** floor plans rebuilt — tabs 1/2/3/**Penthouse** + per-tab type chips; layouts stored as `floorplans.layouts` lists (`plansJson` = `{one:[],two:[],three:[],penthouse:[]}`; legacy single-object drafts still load). Seeded from `public/uploads/seven-x-seven-floor-plan-previews/`. The location section's light Google-map takeover (flat gray screen) was removed — dark map stays for the whole phase and the live map never loads. Logos were already CMS-editable (Brand section).
- **Homepage tail:** `getHomeStaticTail()` serves only the delivered `pdf-section` bands — the old hidden homepage (second H1, internal "quiet luxury" note) is no longer shipped to browsers (test-guarded in `legacy-home.test.ts`).
- **Uploads:** every prominent AssetUrlField states recommended dimensions/weight; the real production ceiling is Vercel's ~4.5 MB request body, not the 250 MB the old help text claimed.
- **Mortgage calculator:** heading/intro are investor-guide CMS fields (`mortgageCalculatorHtmlWith`), applied on the invest page AND development pages; fallback keeps delivered wording (test-guarded).

**Salesforce (working against UAT):** client-credentials flow verified end-to-end; test Leads `00QWF00000OtI8C2AV` (created, safe to delete) and one rejected Unit-lookup probe. Mapping in `SALESFORCE_PROJECT_RECORD_IDS`: seven x seven → `a08WF00000oCRm3YAG` (Kasumigaseki Residences) is an agreed UAT placeholder. `Property_Interest__c` rejects Unit IDs (tested — FIELD_INTEGRITY_EXCEPTION). Outstanding: villa mapping decision (Project records vs new Unit field vs Description-only), Vercel env mirror of `SALESFORCE_CLIENT_ID` + `SALESFORCE_PROJECT_RECORD_IDS`, IP-policy answer for Vercel dynamic egress.

**Salesforce feedback round (2026-11-06, Mohamad's email — implemented):** the villa decision is settled — Villa 174 / Dubai Hills Mansion stay **Description-only with `Property_Interest__c` blank** (client-confirmed; no `SALESFORCE_PROJECT_RECORD_IDS` entries for them), seven x seven keeps the Kasumigaseki Residences placeholder, and the inventory doc's `ProductInterest__c`/`LeadSourceDetail__c` are obsolete. Required Lead fields per the client = **first name, last name, email** — `missingSalesforceLeadFields` no longer requires phone (booking/mortgage/floor-plan forms leave it optional; it was causing guaranteed FAILED rows), phone is sent when a form collects it. Fixes shipped: contact form no longer prepends Title to the name (SF FirstName was becoming "Mr." — title is now a labelled detail), `SevenXSevenFresh` sends `interest: "seven x seven"` (the TypeOfLead text never matched the map → lookup was silently blank), floor-plan modal requires name + email (`site-cms.js?v=20261106-sf-forms`). `scripts/sf-uat-matrix.ts` (`npx tsx scripts/sf-uat-matrix.ts`) runs the 12-scenario UAT matrix (forces client-credentials by stripping username/password from the loaded .env.local; results file in %TEMP%). Run 2: **10/12 PASS** — all mapping/field checks verified. **Two org issues found, client-side to fix:** (1) the Lead duplicate rule does NOT block — repeat exact-email submissions created fresh Leads (rows 11-12), so append-to-existing can never trigger until the rule is re-activated with allowSave=false; (2) the client-credentials run-as user `m.bitar@atccoms.com` sees **zero** Leads (`COUNT()=0`) while creates succeed → the SOQL duplicate fallback and the GET/PATCH append cannot work; fix = add that user to the `website_leads` queue or grant read on queue-owned Leads. 24 matrix test Leads (ids listed in the results files, `kpd-sf-uat-results-2026-11-06.md` + `-run1.md` in %TEMP%) are safe to delete after client review. Note: local `.env.local` still carries `SALESFORCE_USERNAME`/`PASSWORD`, so local runs use the password-grant branch while Vercel (client id/secret only) will use client-credentials — clear them locally for parity, or mirror them to Vercel deliberately. Still outstanding: Dalia/Rayan's final form list + per-type owner, the two org fixes above, villa production mapping before go-live, Vercel env mirror + IP policy.

## 11. Homepage uplift preview (Nov 2026, branch `home-uplift`, PR #1 — NOT merged)

Client unhappy with the homepage *design* (not content) and supplied `KPD-option-2.1.html` (a self-contained "Gallery light" monograph concept: white walls, ink Manrope + IBM Plex Mono captions, hairlines). User decisions: keep the delivered header/footer and ALL current content/sections; build at a separate comparison page; never overwrite `/` before approval. The full concept (its own header/footer/drawer/dock/Lenis) and its new *content* (AUM band, "The Art of Knowing" h1, values trio) are deliberately out of scope until feedback.

- `HomeMain` has `variant?: "uplift"` — default markup is byte-identical to today's `/` (verified); uplift mode only ADDS mono kickers (About KPD / Latest Development / The Collection / Contact / Experience Centre / Media).
- New `src/app/(homepage)/home-uplift.css` (concept tokens as `--up-*` + section restyles) is imported ONLY by the nested `(homepage)/home-uplift/layout.tsx` and scoped under `body.home-uplift-page`; `HomeUpliftView` sets that body class via `DeliveredBodyClass`. `site.css` stays byte-frozen; delivered chrome untouched (rules target `main.development-pdf-home` only).
- `/home-uplift` renders `HomeUpliftView` (same data as `/`), is `noindex`, excluded from the sitemap, and shows a fixed "Uplift preview" ribbon.
- IBM Plex Mono 400/500 self-hosted in `public/fonts/` (region blocks Google Fonts; same reasoning as figtree-local).
- Rollout: branch pushed, **PR #1 open**, Vercel preview BUILT but behind **Vercel Deployment Protection (SSO)** — the user logs into Vercel to view it; for client review either disable preview protection or share a bypass. Preview alias: `https://kpd-git-home-uplift-wickfirms-projects.vercel.app/home-uplift`.
- Flip-over after approval: pass `variant="uplift"` on `/(homepage)/page.tsx`, delete the preview route, merge.
- Local caveat: Supabase put this machine's IP in auth-failure circuit-breaker (both pooler + direct unreachable) during development — known transient; local rendering falls back to empty CMS sections until it lifts. Production/preview (Vercel IPs) unaffected. Also noticed: `kpd.ae` does not serve the app (2597-byte page); the live app is `kpd-eight.vercel.app`.
