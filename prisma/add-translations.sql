-- Arabic and Japanese translations of CMS content (the second languages pull request).
--
-- Additive only, and safe to run more than once: four new nullable columns, five
-- columns that become nullable, and a primary key for two tables that never
-- had one (both are empty until a translation is saved). Nothing in the English
-- content changes, and the site as it is live keeps working whether or not this
-- has run.
--
-- Run it in the Supabase SQL Editor (project kpd-mena) BEFORE the pull request
-- is merged. `npm run db:push` would make the same change; the two were checked
-- to leave the database identical (prisma migrate diff prints nothing).
--
--   article_translations   title, summary, body: null = show the English text;
--                          coverImageAlt is new.
--   project_translations   name: null = show the English name; location is new.
--   page_translations      title, content: null = show the English text.
--   project_modules        translations: { "ar": { title, content }, "ja": { … } } —
--                          only the text that differs from English.
--   content_versions       locale: "ar" or "ja" for the save of a translation,
--                          null for an English save. Each language keeps its own
--                          version history.

ALTER TABLE IF EXISTS "article_translations"
  ALTER COLUMN "title" DROP NOT NULL,
  ALTER COLUMN "summary" DROP NOT NULL,
  ALTER COLUMN "body" DROP NOT NULL;
ALTER TABLE IF EXISTS "article_translations" ADD COLUMN IF NOT EXISTS "coverImageAlt" TEXT;

ALTER TABLE IF EXISTS "project_translations"
  ALTER COLUMN "name" DROP NOT NULL;
ALTER TABLE IF EXISTS "project_translations" ADD COLUMN IF NOT EXISTS "location" TEXT;

ALTER TABLE IF EXISTS "page_translations"
  ALTER COLUMN "title" DROP NOT NULL,
  ALTER COLUMN "content" DROP NOT NULL;

ALTER TABLE IF EXISTS "project_modules" ADD COLUMN IF NOT EXISTS "translations" JSONB;
ALTER TABLE IF EXISTS "content_versions" ADD COLUMN IF NOT EXISTS "locale" TEXT;

-- page_translations and project_translations were created without a primary
-- key. Each takes its id as the key, where it has none yet.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'page_translations')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'page_translations_pkey') THEN
    ALTER TABLE "page_translations" ADD CONSTRAINT "page_translations_pkey" PRIMARY KEY ("id");
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_translations')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_translations_pkey') THEN
    ALTER TABLE "project_translations" ADD CONSTRAINT "project_translations_pkey" PRIMARY KEY ("id");
  END IF;
END $$;
