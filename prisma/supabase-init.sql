-- ═════════════════════════════════════════════════════════════════════════════
-- KPD Website & CMS — Supabase initialization (schema + seed)
-- Generated from prisma/schema.prisma + prisma/seed.ts
-- Paste into: Supabase → SQL Editor → New query → Run
-- Safe to re-run (idempotent: IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS "public";

-- ── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR');
CREATE TYPE "ArticleKind" AS ENUM ('NEWS', 'BLOG');
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ProjectProfile" AS ENUM ('FULL', 'RESTRICTED');
CREATE TYPE "ModuleKind" AS ENUM ('GALLERY', 'FLOOR_PLAN', 'SPECIFICATIONS', 'LOCATION', 'VIDEO', 'BROCHURE', 'CUSTOM');
CREATE TYPE "RssItemStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'SYNCED', 'FAILED');

-- ── Tables ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "ArticleKind" NOT NULL DEFAULT 'NEWS',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "coverImage" TEXT,
    "coverImageAlt" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "sourceRssItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "article_translations" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    CONSTRAINT "article_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "profile" "ProjectProfile" NOT NULL DEFAULT 'FULL',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "heroImage" TEXT,
    "location" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "project_modules" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "ModuleKind" NOT NULL DEFAULT 'CUSTOM',
    "profile" "ProjectProfile" NOT NULL DEFAULT 'FULL',
    "content" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "project_translations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    CONSTRAINT "project_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rss_items" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "snippet" TEXT,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "status" "RssItemStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rss_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "contact_submissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "interest" TEXT,
    "sourcePage" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NEW',
    "salesforceId" TEXT,
    "syncError" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "static_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "static_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "page_translations" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    CONSTRAINT "page_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "site_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_key" ON "articles"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "articles_sourceRssItemId_key" ON "articles"("sourceRssItemId");
CREATE INDEX IF NOT EXISTS "articles_kind_status_publishedAt_idx" ON "articles"("kind", "status", "publishedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "article_translations_articleId_locale_key" ON "article_translations"("articleId", "locale");
CREATE UNIQUE INDEX IF NOT EXISTS "projects_slug_key" ON "projects"("slug");
CREATE INDEX IF NOT EXISTS "project_modules_projectId_profile_sortOrder_idx" ON "project_modules"("projectId", "profile", "sortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "project_modules_projectId_slug_key" ON "project_modules"("projectId", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "project_translations_projectId_locale_key" ON "project_translations"("projectId", "locale");
CREATE UNIQUE INDEX IF NOT EXISTS "rss_items_url_key" ON "rss_items"("url");
CREATE INDEX IF NOT EXISTS "rss_items_status_publishedAt_idx" ON "rss_items"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "contact_submissions_status_idx" ON "contact_submissions"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "static_pages_slug_key" ON "static_pages"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "page_translations_pageId_locale_key" ON "page_translations"("pageId", "locale");

-- ── Foreign keys ─────────────────────────────────────────────────────────────
ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_sourceRssItemId_fkey";
ALTER TABLE "articles" ADD CONSTRAINT "articles_sourceRssItemId_fkey" FOREIGN KEY ("sourceRssItemId") REFERENCES "rss_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "article_translations" DROP CONSTRAINT IF EXISTS "article_translations_articleId_fkey";
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_modules" DROP CONSTRAINT IF EXISTS "project_modules_projectId_fkey";
ALTER TABLE "project_modules" ADD CONSTRAINT "project_modules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_translations" DROP CONSTRAINT IF EXISTS "project_translations_projectId_fkey";
ALTER TABLE "project_translations" ADD CONSTRAINT "project_translations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "page_translations" DROP CONSTRAINT IF EXISTS "page_translations_pageId_fkey";
ALTER TABLE "page_translations" ADD CONSTRAINT "page_translations_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "static_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ═════════════════════════════════════════════════════════════════════════════
-- SEED DATA (matches prisma/seed.ts)
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Articles (6, migrated from the legacy articles.js) ───────────────────────
INSERT INTO "articles" ("id", "slug", "kind", "title", "summary", "body", "coverImage", "coverImageAlt", "status", "publishedAt", "updatedAt")
VALUES
('kpd_art_01', 'design-underwriting-endurance', 'NEWS',
 'Design, Underwriting & Endurance Forum',
 'A closed-room discussion on land logic, delivery discipline, design intent, and how long-horizon value is protected before a project reaches market.',
 '["KPD convened a focused forum around the relationship between design, underwriting, and long-term project relevance. The conversation centered on how early feasibility decisions shape every later layer of a development, from frontage and arrival to operations, maintenance, leasing, and resale confidence.","The session treated design as a commercial discipline rather than a decorative layer. Participants discussed why enduring residential value depends on a project being clear about its audience, its service logic, its public edges, and the daily routines it supports.","For KPD, this is where development begins: with the patience to test assumptions, the restraint to avoid unnecessary complexity, and the discipline to make places that remain useful and memorable beyond launch."]'::jsonb,
 '/legacy/assets/images/library/bottom-up-view-of-modern-office-building-in-hong-k-2026-03-26-06-21-57-utc.jpg',
 'Dubai financial district and real estate context',
 'PUBLISHED', '2026-06-10T00:00:00Z', NOW()),
('kpd_art_02', 'seven-x-seven-project-note', 'NEWS',
 'Seven X Seven: A Denser Urban Brief',
 'A sharper urban mixed-use brief built around positioning, movement, and future delivery logic.',
 '["Seven X Seven is shaped around an urban reading of density, frontage, and movement. The project is positioned to make its address, arrival sequence, and residential experience feel coherent from the street to the private interior.","Rather than relying on scale alone, the project uses measured facade rhythm, amenity logic, and material restraint to create a residential experience that is composed and commercially legible.","The development reflects KPD''s wider approach: every spatial decision should carry operational, experiential, and long-term value."]'::jsonb,
 '/legacy/assets/images/project-media/sxs/facade%20left%202.png',
 'Seven X Seven facade render',
 'PUBLISHED', '2026-06-01T00:00:00Z', NOW()),
('kpd_art_03', 'emerald-villa-private-preview', 'NEWS',
 'Emerald Villa Private Preview',
 'An invitation-only preview of Emerald Villa''s planning, amenity story, and garden-led residential experience.',
 '["Emerald Villa was presented through a private preview focused on the relationship between arrival, landscape, privacy, and interior calm. The walkthrough introduced the project as a residential environment shaped for family-scaled living and long-horizon ownership.","The preview highlighted the role of garden rooms, shaded outdoor areas, and warm interior materiality in creating a home that feels generous without becoming performative.","KPD''s team framed the project as a quieter expression of luxury: one built around clarity, daily use, and a composed sense of permanence."]'::jsonb,
 '/legacy/assets/images/project-media/Emerald%20Villa/12_2.jpg',
 'Emerald Villa exterior arrival',
 'PUBLISHED', '2026-05-22T00:00:00Z', NOW())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "articles" ("id", "slug", "kind", "title", "summary", "body", "coverImage", "coverImageAlt", "status", "publishedAt", "updatedAt")
VALUES
('kpd_art_04', 'land-logic-before-form', 'BLOG',
 'Land Logic Before Form',
 'Why site constraints, arrival, frontage, and address behavior shape a development long before architecture is drawn.',
 '["Every development begins with land, and land always speaks first. Before massing, materiality, or marketing, the site defines what arrival feels like, where the sun sits, how frontage behaves, and what the address will mean in ten years.","Constraints are not obstacles to design; they are the beginning of it. A plot that demands patience usually rewards it, shaping projects that remain relevant beyond launch cycles.","Form refined by land logic does not limit ambition; it can refine a proposition that already understands its place."]'::jsonb,
 '/legacy/assets/images/blog/blog-4.jpg',
 'Aerial site planning context',
 'PUBLISHED', '2026-05-10T00:00:00Z', NOW()),
('kpd_art_05', 'what-makes-yield-durable', 'BLOG',
 'What Makes Yield Durable',
 'A note on rental readiness, service-charge discipline, and product features that remain relevant beyond launch.',
 '["Yield durability is rarely created by one headline number. It is built through a sequence of small decisions that make a property easy to understand, easy to operate, and easy to live in.","Rental readiness depends on product clarity, furnishing logic, maintenance discipline, and amenities that support real routines rather than marketing lists. Service-charge control matters because it protects the net experience for owners and tenants alike.","The strongest projects remain legible after launch. They offer a clear reason to be chosen again, not just a reason to be noticed once."]'::jsonb,
 '/legacy/assets/images/blog/blog-5.jpg',
 'Residential landscape and market context',
 'PUBLISHED', '2026-04-28T00:00:00Z', NOW()),
('kpd_art_06', 'quiet-architecture', 'BLOG',
 'Quiet Architecture',
 'How restraint, material clarity, and practical operations can create a stronger residential experience.',
 '["Quiet architecture does not mean passive architecture. It means design that knows when to hold back, when to frame, and when to let daily life take priority.","In residential development, restraint can be a form of confidence. Clear materials, controlled light, practical circulation, and durable details often create a stronger experience than excessive visual noise.","For KPD, the aim is not to make buildings that shout at first glance. It is to make places that continue to feel considered after years of use."]'::jsonb,
 '/legacy/assets/images/blog/blog-6.jpg',
 'Modern facade and residential materiality',
 'PUBLISHED', '2026-04-12T00:00:00Z', NOW())
ON CONFLICT ("slug") DO NOTHING;

-- ── Projects (3 live developments) ───────────────────────────────────────────
INSERT INTO "projects" ("id", "slug", "name", "tagline", "profile", "status", "heroImage", "location", "sortOrder", "publishedAt", "updatedAt")
VALUES
('kpd_prj_01', 'seven-x-seven', 'Seven X Seven', 'A denser urban brief', 'FULL', 'PUBLISHED',
 '/legacy/assets/images/project-media/sxs/facade%20front%202.png', 'Dubai', 1, NOW(), NOW()),
('kpd_prj_02', 'emerald-villa', 'Emerald Villa', 'A garden-led residential environment', 'FULL', 'PUBLISHED',
 '/legacy/assets/images/project-media/Emerald%20Villa/13_2.jpg', 'Dubai', 2, NOW(), NOW()),
('kpd_prj_03', 'dubai-hills-mansion', 'Dubai Hills Mansion', 'A private estate address', 'FULL', 'PUBLISHED',
 '/legacy/assets/images/project-media/Dubai%20Hills%20Mansion/6_plex_front_rev_final_1.jpg', 'Dubai Hills Estate', 3, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- ── Project modules (galleries) ──────────────────────────────────────────────
INSERT INTO "project_modules" ("id", "projectId", "slug", "title", "kind", "profile", "content", "sortOrder", "updatedAt")
VALUES
('kpd_mod_01', 'kpd_prj_01', 'gallery', 'Facade Gallery', 'GALLERY', 'FULL',
 '{"images": ["/legacy/assets/images/project-media/sxs/facade%20left%202.png"]}'::jsonb, 0, NOW()),
('kpd_mod_02', 'kpd_prj_02', 'gallery', 'Arrival & Interiors', 'GALLERY', 'FULL',
 '{"images": ["/legacy/assets/images/project-media/Emerald%20Villa/12_2.jpg"]}'::jsonb, 0, NOW())
ON CONFLICT ("projectId", "slug") DO NOTHING;

-- ── CMS pages (placeholders — content supplied in Phase 4) ───────────────────
INSERT INTO "static_pages" ("id", "slug", "title", "content", "status", "updatedAt")
VALUES
('kpd_page_01', 'faq', 'Frequently Asked Questions',
 '[{"type":"paragraph","text":"Placeholder — FAQ copywriting to be produced during Phase 4 (content population)."}]'::jsonb,
 'DRAFT', NOW()),
('kpd_page_02', 'privacy-policy', 'Privacy Policy',
 '[{"type":"paragraph","text":"Placeholder — final text to be supplied by the client''s legal counsel (Clause 3) and wired through the CMS (Clause 2)."}]'::jsonb,
 'DRAFT', NOW()),
('kpd_page_03', 'terms', 'Terms & Conditions',
 '[{"type":"paragraph","text":"Placeholder — final text to be supplied by the client''s legal counsel (Clause 3) and wired through the CMS (Clause 2)."}]'::jsonb,
 'DRAFT', NOW())
ON CONFLICT ("slug") DO NOTHING;
