-- Restores the delivered portrait URLs for the existing CMS team members.
-- Vincent and Rayan are intentionally not created or restored.
-- Safe to re-run: it updates only these three named members.

UPDATE static_pages
SET content = (
  SELECT jsonb_agg(
    CASE WHEN block->>'type' = 'about' THEN jsonb_set(
      block,
      '{management}',
      (
        SELECT jsonb_agg(
          CASE member->>'name'
            WHEN 'Hiroyuki Chiba' THEN member || jsonb_build_object('image', '/legacy/assets/images/team/Chiba.jpg')
            WHEN 'Ammar Al Tamimi' THEN member || jsonb_build_object('image', '/legacy/assets/images/team/Ammar.jpg')
            WHEN 'Anas Al Khatib' THEN member || jsonb_build_object('image', '/legacy/assets/images/team/Anas.jpg')
            ELSE member
          END
        )
        FROM jsonb_array_elements(block->'management') AS member
      )
    ) ELSE block END
  )
  FROM jsonb_array_elements(content) AS block
), "updatedAt" = NOW()
WHERE slug = 'about'
  AND jsonb_typeof(content) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(content) AS block,
         jsonb_array_elements(block->'management') AS member
    WHERE block->>'type' = 'about'
      AND member->>'name' IN ('Hiroyuki Chiba', 'Ammar Al Tamimi', 'Anas Al Khatib')
  );
