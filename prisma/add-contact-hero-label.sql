-- Adds the CMS-controlled Contact hero label without changing other content.
UPDATE static_pages
SET content = (
  SELECT jsonb_agg(CASE WHEN block->>'type' = 'hero' THEN block || jsonb_build_object('eyebrow', 'Contact Us') ELSE block END)
  FROM jsonb_array_elements(content) AS block
), "updatedAt" = NOW()
WHERE slug = 'contact';
