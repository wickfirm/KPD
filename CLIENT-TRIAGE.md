# Client Complaint Triage â€” KPD Website & CMS

Status after the 2026-09-29 fix round. Verification: `npx tsc --noEmit` clean, `npm run build` clean.

## Fixed in this round (no client action needed)

| # | Complaint | Resolution |
|---|-----------|------------|
| 1 | KPD calculator does not match site styling / spacing / padding | The full delivered stylesheet (incl. all planner styles) already loads on migrated pages via `public.css`. Added planner form font inheritance and accordion styles; planner markup class names unchanged, so it now renders with identical spacing/typography context as the legacy pages. |
| 2 | Purchase price needs accordion selection + manual entry | `ownership-cost-planner.js` now renders an accordion of the developments with their starting prices, plus an "Enter a custom amount" option that reveals the manual input. Prices come from the CMS (Calculator editor). |
| 3 | "Discuss This Plan" popup button invisible / not working | The bottom-right **Inquiry** launcher + booking modal now render on every migrated page (`BookingWidget`, mirrors legacy markup/classes). "Discuss this plan" opens the popup and pre-fills the message with the calculated scenario; the form submits to `/api/contact` (database + Salesforce mirror) instead of `mailto:`. Header "Book online call" opens the same popup. Auto-opens once ~5s after arrival, matching legacy behaviour. |
| 4 | Investor page UI altered vs approved design | `/invest-in-dubai` restored to the full approved template: benefits carousel + progress, "Dubai vs Global Hubs" yield board, payment plans, Golden Visa/residency, investment pathway carousel with prev/next controls, developer trust, liquidity & exit, featured developments, 5-question FAQ, and the closing inquiry CTA (opens popup). |
| 5 | News page UI altered vs approved design | `/news` restored: All/News/Blogs filter tabs, live-feed status bar with working **Refresh Feed** (pulls published articles from the CMS via `/api/articles`), news grid + blog grid, empty state. The missing `.news-design-page` wrapper class (which broke the grid styling) is restored. |
| 6 | Article editor shows JSON notation for body paragraphs | Editor now shows plain paragraphs separated by blank lines (the stored JSON is converted on load; both formats still save). |
| 7 | Calculator editor too technical (pipe notation) | Each development now has labeled payment-step rows (step name / % / date) with add/remove buttons and a running total that flags when it must reach 100%. |
| 8 | Team management cards poorly arranged | About-page team editor cards are now portrait-first (photo thumbnail beside name/role/bio) with improved responsive layout. |
| 9 | "Create Page" unclear; key pages missing from CMS | Pages section now lists a fixed registry: **Homepage, About us, Investor guide, Contact, Legacy** â€” each with an editor and a View-page link. Free-form "Create page" removed (additional page templates are a developer task; any extra rows already in the system are still listed and editable). |
| 10 | Homepage content buried under Site Settings | New dedicated editor: **Pages â†’ Homepage** (hero video, introduction, developments heading, contact strip, Experience Center gallery). Site Settings now holds only contact/footer details and links to the Homepage editor. Contact and Investor guide pages now read their hero heading/copy/image from the CMS. |

## Needs client input / hosting configuration (not code-fixable here)

| # | Item | What is needed |
|---|------|----------------|
| 11 | RSS news ingest "not configured" | The pipeline exists (`/api/cron/rss-ingest`, keyword matching in `src/lib/rss.ts`). Needs: (a) confirmation of the news sources/keywords to follow, (b) `CRON_SECRET` env var set on the hosting account so the Vercel cron (every 30 min) can call it. |
| 12 | Contact/booking form "not configured" (Salesforce) | The form always saves locally; the Salesforce mirror needs `SALESFORCE_*` credentials in env (see `.env.example`). Without them, submissions show as `FAILED` sync in Admin â†’ Submissions and can be retried/reviewed there. |
| 13 | Omnixia / hosting access | Client to provide access or confirm the deployment target so env vars, cron, and the database (Supabase `DATABASE_URL`/`DIRECT_URL`) can be configured in production. |
| 14 | CMS admin layer requests (user roles & permissions, password changes, activity logs, version history/rollback, backups, DB health, media library, analytics) | Current build: single shared login (ADMIN/EDITOR roles exist but no per-role permissions), first-admin bootstrap via env. These are roadmap features requiring schema additions; proposed order: (1) change-own-password + user management, (2) activity log, (3) content versioning/rollback, (4) backups + health dashboard, (5) media library grid, (6) analytics (e.g. Vercel Analytics). Please prioritise. |
| 15 | Restaurant-website CMS reference | Noted as the UX benchmark for the editor experience; the Pages/Calculator/team-card editors in this round move in that direction. A working demo link from the client would help calibrate the next admin-layer phase. |

## Verification notes

- Legacy pages under `/legacy/**` also benefit from fixes 2â€“3 (shared planner JS; their `site.js` booking modal is auto-filled with the scenario via a small observer added to the planner script).
- No database schema changes were made, so no migration is required for this round.
- Cache-busting: planner script version bumped to `?v=20260929` in both the migrated page and legacy template.

---

## RESOLVED — Work order 2026-10 (delivered)

The client green-lit the full 7-point admin work order. Delivered on branch `cline/wo-2026-10`:

1. **CMS UX overhaul** — sidebar shell with grouped plain-language navigation, friendly dashboard (attention list, quick actions, stats, tips), success/confirmation banners on every editor, confirmation dialogs on destructive actions, friendly empty states, polished login.
2. **KPD calculator restyle** — full visual pass on the public Ownership Cost Planner (`.ownership-planner`), matched to site styling: spacing, typography, focus rings, price accordion, results panel with dotted-leader timeline, compact + mobile variants. (`public/legacy/assets/css/site.css`, appended block dated 2026-10-01.)
3. **Roles & permissions** — `ADMIN` (settings, team, activity log, media deletion) vs `EDITOR` (content + media uploads + reviews). Enforced three layers: sidebar visibility, page guards (`requireRole`), and every server action (`requireUser` re-checks the live account; deactivated users are bounced immediately).
4. **Password & profile management** — `/admin/profile`: change own password (current password required, 10+ chars with letters+numbers), update display name, see last sign-in / password age. Admins reset any password under `/admin/users`.
5. **Activity log** — append-only `activity_logs` table; every admin mutation, sign-in/out (incl. failures), media and version action is recorded. `/admin/activity` (admin-only): action filter chips + 50-per-page pagination; latest 6 shown on the dashboard.
6. **Version control + rollback** — every save of articles, pages, homepage, about, developments, sections, site settings and the calculator stores a snapshot; newest 5 kept per item (6th save evicts the oldest, FIFO). Restore replays the snapshot through the normal save path (same validation + logging), is itself undoable, and can even resurrect deleted items. UI: "Version history" panels on each editor + per-section history inside development pages.
7. **Media manager** — `/admin/media` backed by Cloudflare R2 + new `media_assets` registry: multi-file upload (25 MB, typed), copy-link buttons, thumbnails, pagination, admin delete (R2 + registry), one-click "import files already in storage". All CMS uploads (including the cover-image picker API) now register automatically.

Schema: new tables `activity_logs`, `content_versions`, `media_assets`; new `users` columns `isActive`, `lastLoginAt`, `passwordChangedAt`. Applied to production (Supabase) on 2026-10-01; also mirrored in `prisma/supabase-init.sql` for fresh environments.
