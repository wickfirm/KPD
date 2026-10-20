-- CMS recovery supplement — run AFTER apply-v2-website-copy.sql.
-- Completes the homepage settings introduced after the baseline migration.
-- Existing values win, so this can be safely re-run without replacing edits.

BEGIN;

INSERT INTO site_settings (key, value, "updatedAt") VALUES (
  'home',
  $json${
    "developmentTextVisible": true,
    "developmentText": "Quality, peace of mind and innovation are not a tier we reserve for certain projects. They are the standard every Kasumigaseki development is held to, whatever its form or price.",
    "newsHeading": "The Latest from Kasumigaseki Properties Development.",
    "newsText": "Development updates, market notes and the thinking behind how we build.",
    "newsCta": "Read News & Insights",
    "experienceImages": [
      "/legacy/assets/images/experience-center/hq/1.jpg",
      "/legacy/assets/images/experience-center/hq/4.jpg",
      "/legacy/assets/images/experience-center/hq/7.jpg",
      "/legacy/assets/images/experience-center/hq/14.jpg",
      "/legacy/assets/images/experience-center/hq/17.jpg"
    ],
    "experienceCaptions": [
      "Private Consultation",
      "Model Walkthrough",
      "Delivery Workspace",
      "Asset Performance",
      "Platform Note"
    ]
  }$json$::jsonb,
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value || site_settings.value,
    "updatedAt" = NOW();

-- Ensure the CMS About block always carries the management team. This is only
-- used when a saved About block is missing its team, so saved team edits stay.
WITH defaults AS (
  SELECT $json$[
    {"name":"Tatsuya Suzuki","role":"CEO","bio":"","image":"/team/tatsuya-suzuki.jpg"},
    {"name":"Hiroyuki Chiba","role":"Executive Director","bio":"","image":""},
    {"name":"Ammar Al Tamimi","role":"Development Director","bio":"","image":""},
    {"name":"Anas Al Khatib","role":"Commercial Director","bio":"","image":""}
  ]$json$::jsonb AS team
)
UPDATE static_pages page
SET content = (
  SELECT jsonb_agg(
    CASE
      WHEN block->>'type' = 'about'
        AND COALESCE(jsonb_array_length(block->'management'), 0) = 0
      THEN jsonb_set(block, '{management}', defaults.team)
      ELSE block
    END
  )
  FROM jsonb_array_elements(page.content) AS block, defaults
), "updatedAt" = NOW()
WHERE page.slug = 'about'
  AND jsonb_typeof(page.content) = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(page.content) AS block
    WHERE block->>'type' = 'about'
      AND COALESCE(jsonb_array_length(block->'management'), 0) = 0
  );

COMMIT;
