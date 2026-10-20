-- Adds the independent lower About-page heading to the existing CMS block.
-- It preserves all existing CMS content and can be safely re-run.
UPDATE static_pages
SET content = (
  SELECT jsonb_agg(
    CASE WHEN block->>'type' = 'about' AND NOT (block ? 'sectionHeading')
      THEN block || jsonb_build_object('sectionHeading', 'Built on understanding.')
      ELSE block
    END
  )
  FROM jsonb_array_elements(content) AS block
), "updatedAt" = NOW()
WHERE slug = 'about'
  AND jsonb_typeof(content) = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(content) AS block
    WHERE block->>'type' = 'about' AND NOT (block ? 'sectionHeading')
  );
