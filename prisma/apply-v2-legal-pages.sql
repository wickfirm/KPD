-- KPD V2 copy: CMS-backed legal pages.
-- Source of truth: 162026 KPD - Website Copy (E) V2.docx
-- This file is intentionally held for the final one-run migration bundle.

BEGIN;

INSERT INTO static_pages (id, slug, title, content, status, "updatedAt")
VALUES
  ('page_v2_terms', 'terms', 'Terms of Use', $json$[
    {"type":"hero","heading":"Terms of Use"},
    {"type":"paragraph","text":"These terms govern use of the Kasumigaseki Properties Development website and the information presented across project, company, news and contact pages."},
    {"type":"heading","heading":"Website Information"},
    {"type":"paragraph","text":"Content is provided for general information only. Project information, images, dimensions, features, prices, timelines and availability may change without notice and should be verified directly with Kasumigaseki Properties Development."},
    {"type":"heading","heading":"Use of Content"},
    {"type":"paragraph","text":"Text, images, marks, layouts and design materials are owned by or licensed to Kasumigaseki Properties Development and may not be reproduced or distributed without written permission."},
    {"type":"heading","heading":"No Investment Advice"},
    {"type":"paragraph","text":"Nothing on this website should be treated as financial, legal, tax or investment advice. Visitors should obtain independent advice before making decisions."},
    {"type":"heading","heading":"Contact"},
    {"type":"paragraph","text":"For questions about these terms, contact info@kpd.ae."}
  ]$json$::jsonb, 'PUBLISHED'::"ContentStatus", NOW()),
  ('page_v2_privacy', 'privacy-policy', 'Privacy Policy', $json$[
    {"type":"hero","heading":"Privacy Policy"},
    {"type":"paragraph","text":"Kasumigaseki Properties Development respects the privacy of website visitors, buyers, investors, partners and people who contact us through forms, email or events."},
    {"type":"heading","heading":"Information We Collect"},
    {"type":"paragraph","text":"We may collect contact details, enquiry preferences, message content, event registrations, newsletter signups and basic website usage data."},
    {"type":"heading","heading":"How We Use Information"},
    {"type":"paragraph","text":"Information is used to respond to enquiries, coordinate meetings, share project updates, improve the website experience and maintain appropriate business records."},
    {"type":"heading","heading":"Sharing"},
    {"type":"paragraph","text":"We do not sell personal information. We may share data with service providers, advisers or project partners where needed to respond to a request or operate the website."},
    {"type":"heading","heading":"Your Choices"},
    {"type":"paragraph","text":"You may request access, correction or deletion of your information by contacting info@kpd.ae."}
  ]$json$::jsonb, 'PUBLISHED'::"ContentStatus", NOW()),
  ('page_v2_cookie', 'cookie-policy', 'Cookie Policy', $json$[
    {"type":"hero","heading":"Cookie Policy"},
    {"type":"paragraph","text":"This website may use cookies and similar technologies to support basic operation, understand website performance and improve visitor experience."},
    {"type":"heading","heading":"Types of Cookies"},
    {"type":"paragraph","text":"Essential cookies support page functionality. Analytics cookies help us understand aggregate browsing behaviour. Preference cookies may remember choices made by visitors."},
    {"type":"heading","heading":"Managing Cookies"},
    {"type":"paragraph","text":"You can manage or block cookies through your browser settings. Some parts of the website may not function as intended if cookies are disabled."},
    {"type":"heading","heading":"Updates"},
    {"type":"paragraph","text":"We may update this policy from time to time to reflect website or regulatory changes."},
    {"type":"heading","heading":"Contact"},
    {"type":"paragraph","text":"Share your questions on info@kpd.ae."}
  ]$json$::jsonb, 'PUBLISHED'::"ContentStatus", NOW())
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title, content = EXCLUDED.content, status = EXCLUDED.status, "updatedAt" = NOW();

COMMIT;
