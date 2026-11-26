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
  - **Do not start a local server with the real `DATABASE_URL` on this machine (found 26 Nov 2026).** The local string is not accepted: each attempt fails authentication, the engine reports it as "Can't reach database server", and after a burst the pooler refuses new connections for a while (`FATAL: (ECIRCUITBREAKER) too many authentication failures, new connections are temporarily blocked`). One page load makes several attempts, so capturing twelve pages trips it. Production kept serving each time it was checked, so the block appears to apply per source. The password in `.env.local` is the first thing to verify. To compare rendered pages without the shared database, serve the build with `DATABASE_URL` pointed at a dead local address (`postgresql://nouser:nopass@127.0.0.1:1/postgres`), or at a private local PostgreSQL (see §12, "Verified").
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

## 11. Homepage "Gallery light" redesign — IN REVIEW (branch `home-sections`, PR #2)

**Status: complete and pushed on branch `home-sections` (head `72e37f6`, PR https://github.com/wickfirm/KPD/pull/2, Vercel preview build passing). Production (`origin/main` = `4e40f96` = kpd-eight.vercel.app) is UNTOUCHED — go-live = merge PR #2 (auto-deploy); revert = close PR + delete branch, or `git revert` after merge.** Client approved every batch from local screenshots ("looks good"), then reviewed the preview and flagged two issues (fonts, EC header) which are fixed on the branch.

**What the client approved, section by section** (their Option 2.1 "Gallery light" concept, applied to the CURRENT homepage content — delivered header/footer untouched):
1. Hero — headline onto the video (`The Art **of Knowing**` two-weight look via emphasis markers), supporting line, white pill CTA, working pause control.
2. About — mono kicker + large statement + value trio.
3. Numbers band — first CMS figure renders huge (suffix split outside the animated `<strong>`), rest as breakdown columns; count-up preserved.
4. Developments banner — framed "Now launching" header row + white card (slide name/copy/CTA/dots) + district chip; React carousel intact.
5. Experience Centre — contact block as section header (caption/heading left, copy + black-pill Book-a-visit right) + five-panel accordion with default-expanded first panel, "01 / 05" indices, caption + "View ↗" bars.
6. News band — breathing room, compact heading row, white post cards (grayscale → colour hover) + development cards to match.

**Key mechanisms / hard-won lessons (read before editing the redesign CSS):**
- All redesign CSS lives in labelled blocks in `src/app/(public)/public.css`, scoped to `main.development-pdf-home` (homepage-only element) — EXCEPT selectors that needed the `.home-development-page` body-class prefix to out-rank delivered site.css rules scoped the same way (`.home-development-page .pdf-contact-block h2 { font-size: clamp(42px,4.1vw,65px) }` at (0,3,1) beats any unscoped rule; prefix with `.home-development-page .development-pdf-home …`).
- **The Next CSS pipeline silently DROPS custom-property definitions whose values contain `clamp()`** (`--up-xl/--up-l/--up-m/--up-body/--up-g` vanished → headings fell back to delivered sizes). Do not put clamp() (or any math function) in a custom property in public.css — inline the literal at usage. Plain-value tokens (colours, mono font, ease) survive.
- All homepage sections are centred in one wrap: `.development-pdf-home .pdf-section { width: min(100% - clamp(40px,8vw,128px), 1440px) }`; `.pdf-hero` and `.pdf-numbers` are re-pinned to `width:100%` AFTER that rule (they carry `.pdf-section` and must stay full-bleed).
- Fonts are SELF-HOSTED now: Manrope variable (200-800) + IBM Plex Mono 400/500 in `public/fonts/` with `@font-face` in public.css. Google Fonts import remains as enhancement only — it is blocked/unreliable on the client's network (this caused the "fonts are different" report; the CMS cannot change font families — its typography settings inject size/weight/style only).
- Mobile: the contact/experience header stacking rule must stay AFTER the base 2-col rule in the file (later appends re-declaring the base silently clobber earlier media rules). Verified at 390px: no page-level horizontal overflow; gallery/news run as intentional horizontal snap carousels.
- The timed "Start a conversation" popup (~5s) is DELIVERED behaviour (`initTimedBookingPopup`, Site-settings controlled) — dismiss it when reviewing screenshots.

**New CMS fields (Homepage editor):** heroText / heroCtaLabel / heroCtaUrl, introKicker, introValues list, statsKicker, developmentKicker, contactKicker, BannerSlide.tag (chip). Editor emphasis syntax in statement/heading fields: `**bold**` and `[[soft grey]]` (`src/lib/emphasis.tsx`). First Key figure = the big headline number; slide "Card title" = visible card heading. `loadHomeSettings()` falls back to delivered defaults (not {}) when the DB is unreachable; `galleryPanels` defaults now wire the gallery fallback too.

**CLIENT CMS PUNCH LIST after go-live (Homepage editor):** blank every "Text appearance" group (intro heading/text, developments heading, key figure value/caption, contact heading/text, news heading/text, paragraph) — the saved old-design sizes (40px/35px/30px/18px, weight normal) otherwise override the concept scale as inline styles; set the hero headline to `The Art **of Knowing**`; set the developments heading to "Now launching"; shorten slide names to card titles and fill chips ("Meydan Horizon"); optionally add the "Other" figure to Key figures.

**Known-open items on the branch:** the developments-heading duplicates its kicker until the CMS heading is edited to "Now launching" (see punch list). The concept's scroll-driven clip reveal and Lenis smooth-scroll are deliberately not implemented (say so if wanted). Appearance fields on redesigned elements still work when set, but the stylesheet scale wins for font-size/line-height on the display headings (no !important used — the saved values simply postdate the concept and the client will blank them).

**Branch topology (important):** `origin/main` = `4e40f96` = production. The Salesforce round-3 work (villa Description-only mapping, phone optional, `scripts/sf-uat-matrix.ts`, two org issues for Mohamad — duplicate rule not blocking; run-as user sees zero Leads) is on LOCAL branch `sf-round-3` (`aa2dd4a`+`b9c5d05`), NOT merged, NOT pushed — merge or push it separately after the user checks it. Old prototype branch `home-uplift` (local) is obsolete. Merging `home-sections` does NOT carry the SF changes; merging `sf-round-3` later brings them.

**Environment gotchas active during this work:** Supabase put this machine's IP in auth-failure circuit-breaker (local DB unreachable → local CMS-backed pages render delivered defaults via the new fallback; production/Vercel unaffected — it recovers on its own). Dev-server `.next` can serve stale modules after branch switches — `rm -rf .next` + restart. `kpd.ae` is a Hostinger static page (old delivered site), NOT this app — the app is `kpd-eight.vercel.app`.

**Next steps (agreed):** user reviews the refreshed preview → merge PR #2 → live. Then other pages with the same foundation, per-page: user supplies mock/direction, I draft the whole page, they review whole — About first. If the SF org issues get fixed by Mohamad, re-run `scripts/sf-uat-matrix.ts` for the duplicate/append scenarios.

## 12. Languages: Arabic and Japanese — PR 1 of 5 COMPLETE, NOT YET COMMITTED (branch `locales/1-foundation`)

Brief: `KPD-arabic-japanese-dev-brief.md` (25 Nov 2026, written against `main` `904540b`). Five PRs, in the brief's order: (1) routing, helpers, switcher, dictionaries, fonts; (2) CMS storage, merge and editor tabs; (3) right-to-left stylesheet and QA; (4) forms, Salesforce, email, SEO; (5) the translation importer. The rules for everyday work are in `AGENTS.md` under "Languages".

**Status (26 Nov 2026, evening):** PR 1 is complete and verified on branch `locales/1-foundation` (from `main` `904540b`, which has not moved), in the worktree `C:\Users\mbonm\.zcode\worktrees\98b9\Front-end website`. On 26 Nov the user asked for it to be pushed and merged to `main`, and for the pages to be reachable at `/ar` and `/ja` without a language selector; that is built in. The whole change is **staged but not committed**: the Mimosa pre-commit gate refuses every commit in this repo until six pre-existing findings are resolved or accepted — five in `src/lib/salesforce.ts` (`salesforceFetch`, flagged as an SSRF entry) and one in `public/legacy/assets/js/articles.js` (`getCmsArticle`). Neither file is touched by this work and both are already on `main`. The message is in `%TEMP%\kpd-locales\commit-msg-1.txt` and the pull request description in `%TEMP%\kpd-locales\pr-body-1.md`. **Both languages are switched on in the database** — the user ran the first statement under "Switching the languages on" on 26 Nov — so merging makes `/ar/…` and `/ja/…` reachable at once, with no selector and `noindex`.

**What PR 1 contains**
- `src/lib/locales.ts` (pure): `localeFromPath`, `localeHref`, `pageInLocale`, `localizeHtmlLinks`, `isPageAddress`, `formatDate`, `ogLocale`. `src/lib/locale.ts`: `getLocale()`, `getIsLocalePreview()`, and the two questions about the `locales` row kept apart — `getPublishedLocales()` (which languages can be reached) and `getSwitcherLocales()` / `getSwitcherShown()` (which the selector offers), both from one `getLanguageSettings()` read. `src/lib/published-locales.ts`: the `site_settings` key `locales`.
- `src/middleware.ts`: `/ar/…` and `/ja/…` are rewritten to the English route with the `x-kpd-locale` request header. The prefix comes off before the admin guard runs, so `/ar/admin/…` is still met by the sign-in; the prefix is for pages only; `/admin/preview/…?lang=ar|ja` previews a translation.
- Root layout: `<html lang>` and, for Arabic, `dir="rtl"`; a 404 for a language that is not switched on; the language's own stylesheets. Its `generateMetadata` adds `noindex, follow` to the pages of a language while the selector is off.
- `src/lib/i18n/`: `t(locale, "area.name", vars)` with English fallback. `en.ts` holds 148 keys; `ar.ts` and `ja.ts` hold the 56 strings each that the translation sheet `KPD-translations-AR-JA.xlsx` covers, with the sheet's own keys. Translated: navigation, breadcrumbs, the footer, article actions, the news listing, the home page's own labels, About, History, Contact, the Investor Guide, the development pages and the legal tabs. Every sheet row is still a Draft. Still English: the strings the sheet has no row for (92 code strings and 12 footer fields, listed with a usage note in `docs/translations/strings-not-in-sheet.csv`), about 175 strings on the seven x seven landing (their own pass), and all CMS content and forms (PR 2 and PR 4).
- Every internal link in public code goes through `localeHref`: hard-coded links, URLs saved in the CMS (CTAs, cards), the contact form's `[label](/path)` consent lines, and the two blocks of raw HTML (the article page's delivered shell, the homepage tail).
- `pageMetadata`, `webPageJsonLd`, `breadcrumbJsonLd` and `residenceJsonLd` take the locale: canonical and social URL in the page's own language, `og:locale` and `inLanguage` on the other languages only. hreflang is PR 4.
- The switcher (`src/components/public/language-switcher.tsx`, styles in the static `public/locales/language-switcher.css`): compact, in the left navigation on desktop, because the delivered header has no room beside its button on the right; a list under the mobile menu's items; in the footer's legal row; and in the dark overlays and footer of the seven x seven landing. It is offered only when the `locales` row also says `"switcher": true`.
- Fonts, provisional until the client approves them: IBM Plex Sans Arabic (200–700) and Noto Sans JP (variable, 120 character slices), self-hosted from the Fontsource packages (`public/fonts/README.md`). `public/locales/ar.css` and `ja.css` add them to the main font stack and set what each script needs.

**Switching the languages on** — one `site_settings` row, key `locales`; the database is shared with production, so the user runs the SQL. It is read on every page load, so no deploy is needed.
- Reachable at `/ar/…` and `/ja/…`, no selector (asked for on 26 Nov, and switched on by the user the same evening): `{"ar": true, "ja": true}`
- Reachable, selector shown: `{"ar": true, "ja": true, "switcher": true}`
- A language off again: set it to `false` (its addresses are a 404 again).

```sql
insert into site_settings (key, value, "updatedAt")
values ('locales', '{"ar": true, "ja": true}'::jsonb, now())
on conflict (key) do update set value = excluded.value, "updatedAt" = now();
```

**Found while building PR 1, for the next ones**
- The Terms, Privacy and Cookies documents are not CMS content: the text is hard-coded in `src/lib/terms-defaults.ts` (`legalDocuments`), and the public view reads only the hero image and the contact block from the database. `applyTermsCopyOnce` writes a copy of the Terms page into the database once, but the page never renders it. PR 2 has to decide where a translated legal document lives.
- The sheet has no rows for the footer's CMS labels (Company, About Us, News & Updates, Contact Us, the copyright line, "privacy policy.", "Social links").
- For the Japanese reviewer: the sheet translates both "Contact" and "Enquire now" as "お問い合わせ", so the Japanese header shows the same word twice side by side.
- `/developments/*` is a 404 on production at the moment (no development is published), so the development pages cannot be compared on a public preview.

**Decisions taken where the brief left room**
- The switcher lists only the other languages in the header and every published language elsewhere; it is a full page load, never a router navigation.
- Reachable is not the same as offered (26 Nov, on the instruction "don't show the language selection yet"). The brief tied both to one switch; the row now has a third key, `switcher`, off unless exactly `true`. While it is off, the pages of a switched-on language carry `noindex`. That last part is my default, not an instruction: they are half-finished pages on a live domain, and the same key reverses it.
- `/ja` is the only Japanese address. The user once wrote "/jp", a slip on their own account (26 Nov); a temporary `/jp` → `/ja` redirect that had been built for it was taken out again, and a test keeps `/jp/…` from being read as a language.
- English pages do not get `og:locale`. The brief allows only the switcher and hreflang as differences on English; revisit with hreflang in PR 4.
- For the later PRs, agreed in plan: module translations as a nullable JSON column on `project_modules` keyed by locale; `mergeLocale` merges objects by key and arrays by index, blank text falls back to English, and structural or non-text keys are never overridden; editor tabs are the same form in a translation mode (`?lang=ar|ja`) saved by translation-only actions; versions get a nullable `locale` column; the importer is dry-run by default.

**Verified (final build)**
- `tsc --noEmit` clean; 424 tests in 52 files; lint 0 errors (123 warnings against 127 on `main`); `npm run build` passes.
- English is unchanged without a database: 12 addresses and all 3 stylesheets identical to untouched `main`.
- English is unchanged with content: 24 addresses and all 3 stylesheets identical to a build of `904540b` — home, About, History, News, Investor Guide, Contact, the seven x seven landing, six articles, three developments (both page types), three legal pages, `rss.xml`, `sitemap.xml`, `llms.txt` and `/api/articles`. Both builds were served from the same snapshot of a private local PostgreSQL: the machine's installed PostgreSQL 18 programs with their own data folder under `%TEMP%` on `127.0.0.1:5433`, loaded with `prisma db push`, `npm run db:seed` and `npx tsx scripts/refresh-legacy-modules.ts`, and deleted afterwards. Three things have to be made equal on both sides for that comparison to mean anything: the same database snapshot (a fresh seed changes `updatedAt`, which is the articles' `article:modified_time`); a database already asked for once (on an empty one the "run once" steps race, and the seven x seven page streams its title into the body instead of the head); and the build-time copies of `sitemap.xml`, `llms.txt` and `rss.xml` removed from `.next/server/app` (a build made without a database keeps an empty copy for an hour).
- The `locales` row, in four states, on that database:
  - no row: the 30 addresses under `/ar` and `/ja` are a 404, English is unchanged;
  - `{"ar":true,"ja":true}`: all 30 render, 15 as `lang="ar" dir="rtl"` and 15 as `lang="ja"`; the selector is in no page and its stylesheet in none; the English pages are identical to the no-row state; all 998 internal page links keep the page's language; the Arabic and Japanese pages carry `noindex, follow`, the English ones no robots meta;
  - with `"switcher":true` as well: the selector is in 37 pages, the English pages are identical once it is removed, and no page carries a robots meta;
  - `{"ar":true,"ja":false,"switcher":true}`: the Japanese addresses are a 404 and the selector offers English and العربية only.
- `/jp` and `/jp/about` are not a language: they are left in English, and so are a 404.
- Canonical, `og:url`, `og:locale` (`ar_AE`, `ja_JP`) and `inLanguage` follow the page's language; English gets no `og:locale`.
- No cache mixing: the root layout is `force-dynamic`, the legal and article pages answer `no-store` with a cache miss on production, and the English legal pages were identical before and after their Arabic and Japanese versions rendered.
- In Chrome: on the Arabic pages Arabic glyphs rendered in IBM Plex Sans Arabic and Latin in Manrope (one 41 KB file); on the Japanese pages Japanese glyphs rendered in Noto Sans JP (8 slices, 178 KB); English pages fetched no font file. The switcher was measured and screenshotted at 1440 and 390 on the main site and in both overlays of the landing, with no horizontal overflow.

**Not verified**
- Nothing ran against the shared database from this machine (§1), so the content was the repo's seed and delivered templates, not live content. Safari and WebKit were not run.

**Open**
- With Arabic reachable at `/ar/…`, its pages can be looked at by address, but they are not ready for visitors: with `dir="rtl"` the delivered header's own `margin-left: auto` pushes its right-hand group under the logo (60px overlap measured at 1440). Do not switch the selector on for Arabic before PR 3 lands.
- Whether `noindex` while the selector is off is wanted (under "Decisions").
- The fonts are provisional and the sheet is all Draft: both need the client's or the reviewers' approval. `docs/translations/strings-not-in-sheet.csv` is ready to send to the translators.
- A link check for the repository (`scripts/check-locale-links.ts`, the check that found the two un-prefixed links) was refused by the Mimosa scanner, which flags any script that fetches an address given on the command line. The check exists only in `%TEMP%\kpd-locales\tools` for now.

**Next:** commit, push and merge to `main` (asked for on 26 Nov) → compare production with the capture made before the deploy (`%TEMP%\kpd-locales\prod-before`, 25 addresses) → PR 2 (CMS storage, merge, editor tabs; first decide where a translated legal document lives) → PR 3 (right-to-left) → PR 4 (forms, Salesforce, hreflang) → PR 5 (importer).
