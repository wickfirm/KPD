-- CMS recovery preflight — run this FIRST in the Supabase SQL editor.
-- It creates a one-time, recoverable snapshot before applying the baseline
-- content migration. It does not change public content.

BEGIN;

CREATE TABLE IF NOT EXISTS cms_content_backup_20261020 (
  "kind" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB,
  "title" TEXT,
  "status" "ContentStatus",
  "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("kind", "key")
);

INSERT INTO cms_content_backup_20261020 ("kind", "key", "value")
SELECT 'setting', key, value
FROM site_settings
WHERE key IN ('global', 'home', 'invest')
ON CONFLICT ("kind", "key") DO NOTHING;

INSERT INTO cms_content_backup_20261020 ("kind", "key", "value", "title", "status")
SELECT 'page', slug, content, title, status
FROM static_pages
WHERE slug IN ('about', 'legacy', 'contact', 'invest-in-dubai', 'terms', 'privacy-policy', 'cookie-policy')
ON CONFLICT ("kind", "key") DO NOTHING;

COMMIT;

-- Next: run prisma/apply-v2-website-copy.sql in the Supabase SQL editor.
-- Then run prisma/restore-cms-home-supplement.sql.
