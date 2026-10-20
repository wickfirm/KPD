-- Run once in the Supabase SQL Editor.
-- It preserves the Contact page hero and every other content block, replacing
-- only the configurable enquiry-form block.
WITH contact_form AS (
  SELECT $json$
  {
    "type": "contact-form",
    "salesLabel": "Sales Inquiry",
    "customerLabel": "Customer Inquiry",
    "channelLabel": "Channel Partner",
    "jobLabel": "Job Inquiry",
    "pressLabel": "Press Inquiry",
    "salesProjects": ["seven x seven", "Villa 174", "Dubai Hills Mansion", "General enquiry"],
    "customerProjects": ["seven x seven", "Villa 174", "Dubai Hills Mansion", "Other"],
    "customerNatures": ["Handover", "Documentation", "Payment", "Maintenance", "Other"],
    "salesMessagePrompt": "What are you looking for? Share preferred bedrooms, timing or anything specific.",
    "customerMessagePrompt": "Tell us what you need and include any reference or unit number.",
    "channelMessagePrompt": "Tell us about your agency and the markets you cover.",
    "jobMessagePrompt": "A short note on why you would like to join Kasumigaseki Properties Development.",
    "pressMessagePrompt": "Tell us what you are working on and what you need from us."
  }
  $json$::jsonb AS block
),
existing AS (
  SELECT page.id, COALESCE((
    SELECT jsonb_agg(item.block ORDER BY item.position)
    FROM jsonb_array_elements(COALESCE(page.content, '[]'::jsonb)) WITH ORDINALITY AS item(block, position)
    WHERE item.block->>'type' <> 'contact-form'
  ), '[]'::jsonb) AS blocks
  FROM static_pages page
  WHERE page.slug = 'contact'
)
UPDATE static_pages page
SET content = existing.blocks || jsonb_build_array(contact_form.block),
    status = 'PUBLISHED'::"ContentStatus",
    "updatedAt" = NOW()
FROM existing, contact_form
WHERE page.id = existing.id;
