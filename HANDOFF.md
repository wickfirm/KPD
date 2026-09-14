# KPD Website — Session Handoff (2026-09-14)

Purpose: continue work from a fresh terminal. Read AGENTS.md first for repo conventions, then this file for current state.

## Where the project stands

- **Phase 1 (CMS scaffold) — complete** (see AGENTS.md + README.md). Public site is still `public/legacy` static HTML.
- **Phase 2 content work — in progress.** This session produced the full content audit + SEO/AEO rewrite for client review. No code changes were made; everything below is new untracked content deliverables.
- Nothing has been committed this session. Git: branch `main`, untracked only.

## Deliverables created (all untracked)

```
KPD-Content-Tracker.xlsx          ← ORIGINAL audit snapshot (frozen, read-only)
KPD Content Review/               ← CLIENT PACKAGE (zip this folder and send)
├── KPD-Content-Audit.xlsx        ← working tracker, 4 tabs:
│     Section Audit — 156 rows, ALL status "Drafted"; columns: ID, type,
│       rewritten copy, primary/secondary keywords (76 rows), intent,
│       AEO questions (44 rows), status, Client feedback, Doc link (169 working
│       relative hyperlinks → docs/*.docx)
│     Page SEO — 13 pages: current + proposed meta title/description (all within
│       60/155 char limits), target keywords, suggested schema, voice notes
│     Dashboard — live COUNTIF rollup per page (% done)
│     Reference — status lifecycle, working rules, ID scheme, AEO rules
└── docs/                         ← 12 Word docs, one per page group (globals, home,
      3 developments, about, legacy, news, articles, investor, contact, legal).
      Each section: [ID] heading + CURRENT copy + REWRITTEN copy + Status: Drafted
```

- Row IDs: `GLB/HOM/SXS/EVL/DHM/ABO/LEG/MED/BLG/NAR/INV/CON/LGL-nn` (stable refs used in docs + sheet).
- Rewrite voice source: `../Marketing Collaterals/` (Sectorlight Brand Strategy, Messaging Framework, Brand Identity V4 PDFs). Voice = "Turning challenge into value" / "The art of knowing" / Hinshitsu-Anshin-Kakushin / calm-certain-considered / TSE Prime + AUM proof points.

## Open client decisions (search "CLIENT DECISION" in the xlsx)

1. **ABO-06** — About page CEO block duplicates the Chairman quote; distinct replacement quote drafted, needs CEO name/wording approval.
2. **CON-08** — email/domain inconsistency (info@kpd.com vs .ae, kpd.com); standardized to `.ae` in rewrites (matches KASUMIGASEKI.AE collateral); needs client sign-off.
3. **GLB-03 / CON-09** — legacy forms post to `mailto:`; recommend `/api/contact` (Salesforce dual-write, already built) when migrating.

## Next steps (in order)

1. Send `KPD Content Review` folder (zipped) to client; collect feedback in the "Client feedback" column, statuses move: Drafted → In review → Client edits → Approved.
2. Apply revisions; re-verify links if files move (links are relative: `docs/*.docx`).
3. Phase 2 build: migrate `public/legacy` pages to Next.js routes (suggested in Page SEO tab: `/`, `/developments/*`, `/about`, `/about/legacy`, `/news`, `/news/[slug]`, `/invest-in-dubai`, `/contact`, `/legal/*`), keeping front-end markup as-is (relative `assets/` paths preserved).
4. Enter approved copy into CMS: `StaticPage.content` blocks for page sections, Articles for BLG/NAR; development pages via Project + ProjectModule.
5. Phase 2 SEO extras agreed: FAQPage JSON-LD on investor page only (no new FAQ modules anywhere), meta/description per page, Organization/WebSite/ContactPage schema, standardize NAP.

## Handy commands

```bash
npm run dev          # http://localhost:3000 (legacy at /legacy/index.html)
npm run build        # prisma generate && next build
npx tsc --noEmit     # type check (ESLint not installed; npm run lint fails)
npm run db:push      # prisma schema sync (DIRECT_URL)
```

Verification for content work = `npm run build` + `tsc` (no test suite).
