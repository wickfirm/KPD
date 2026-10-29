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
    {"name":"Tatsuya Suzuki","role":"Chief Executive Officer","bio":"","image":"/team/tatsuya-suzuki.jpg"},
    {"name":"Kosuke Urasawa","role":"Managing Director","bio":"","image":"/team/kosuke-urasawa.jpg"},
    {"name":"Tsukasa Chiba","role":"Project & Design Management Head","bio":"","image":"/team/tsukasa-chiba.jpg"},
    {"name":"Ammar Kheder Houri","role":"Real Estate Development Head","bio":"","image":"/team/ammar-kheder-houri.jpg"},
    {"name":"Aqeeb Mohamed Akbar","role":"Sales Manager","bio":"","image":"/team/aqeeb-mohamed-akbar.jpg"},
    {"name":"Musthaaq Mohamed Sabry","role":"Finance Manager","bio":"","image":"/team/musthaaq-mohamed-sabry.jpg"},
    {"name":"Dalia Najib Elsayyed","role":"Customer Relationship Manager","bio":"","image":"/team/dalia-najib-elsayyed.jpg"},
    {"name":"Rayan Kesserwan","role":"Senior Marketing Manager","bio":"","image":"/team/rayan-kesserwan.jpg"},
    {"name":"Mohammad Abdoun","role":"Design Manager","bio":"","image":"/team/mohammad-abdoun.jpg"},
    {"name":"Anas Abdulrazzaq","role":"Project Manager","bio":"","image":"/team/anas-abdulrazzaq.jpg"},
    {"name":"Omar Muwahid","role":"Project Manager","bio":"","image":"/team/omar-muwahid.jpg"},
    {"name":"Mohammad Rizwan Wani","role":"Project Manager","bio":"","image":"/team/mohammad-rizwan-wani.jpg"}
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
