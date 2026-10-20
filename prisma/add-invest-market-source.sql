-- Adds the CMS-editable source note below the Investor Guide yield table.
UPDATE static_pages
SET content = (
  SELECT jsonb_agg(CASE WHEN block->>'type' = 'invest' THEN jsonb_set(
    block, '{market,source}', to_jsonb('Source: Comparative market data compiled from the Savills World Cities Prime Residential Index and Knight Frank Global Research. Figures represent gross market averages and historical cyclical performance.'::text)
  ) ELSE block END)
  FROM jsonb_array_elements(content) AS block
), "updatedAt" = NOW()
WHERE slug = 'invest-in-dubai'
  AND EXISTS (SELECT 1 FROM jsonb_array_elements(content) AS block WHERE block->>'type' = 'invest');
