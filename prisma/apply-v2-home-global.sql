-- KPD V2 copy: shared navigation/footer and Home page.
-- Source of truth: 162026 KPD - Website Copy (E) V2.docx
-- Safe to re-run. This changes content only; it does not alter markup, CSS,
-- media, routes, or database schema.

BEGIN;

INSERT INTO site_settings (key, value, "updatedAt")
VALUES (
  'global',
  $json${
    "email": "info@kpd.ae",
    "phone": "+971 4 388 3099",
    "whatsapp": "https://wa.me/97143883099",
    "newsletterNote": "Project updates, market insights and Kasumigaseki Properties Development news. Sent sparingly.",
    "facebook": "https://www.facebook.com/",
    "x": "https://x.com/",
    "instagram": "https://www.instagram.com/",
    "youtube": "https://www.youtube.com/"
  }$json$::jsonb,
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, "updatedAt" = NOW();

INSERT INTO site_settings (key, value, "updatedAt")
VALUES (
  'home',
  $json${
    "introStats": [
      { "value": "$4.4B", "label": "Global AUM" },
      { "value": "$320M", "label": "Dubai Real Estate" },
      { "value": "$2.27B", "label": "Logistics" },
      { "value": "$1.64B", "label": "Hotels" }
    ],
    "statsNote": "(As of February, 2026)",
    "bannerSlides": [
      { "image": "/legacy/assets/images/project-media/sxs/facade%20left%202.png", "label": "seven x seven Meydan Horizon Residences" },
      { "image": "/legacy/assets/images/project-media/Emerald%20Villa/tm2161_vp29_interior_3brmasterbedroom_rev06.jpg", "label": "Villa 174" },
      { "image": "/legacy/assets/images/library/driveway-of-a-contemporary-house-with-a-garden-are-2026-01-08-00-24-21-utc.jpg", "label": "Villa 24" },
      { "image": "/legacy/assets/images/library/modern-apartment-buildings-with-balconies-on-sunny-2026-03-19-09-29-37-utc.jpg", "label": "Residential development" },
      { "image": "/legacy/assets/images/library/dubai-marina-skyline-with-modern-skyscrapers-and-w-2026-03-05-11-49-49-utc.jpg", "label": "Dubai skyline" }
    ],
    "developmentCards": [
      { "href": "/developments/seven-x-seven", "image": "/legacy/assets/images/project-media/sxs/facade%20right%202.png", "title": "seven x seven Meydan Horizon Residences", "copy": "A composed Meydan Horizon residence where arrival, light and privacy meet measured access to Dubai's core districts." },
      { "href": "/developments/emerald-villa", "image": "/legacy/assets/images/project-media/Emerald%20Villa/37.jpg", "title": "Villa 174", "copy": "A private family villa organised around planted arrival, layered privacy and room for daily life to unfold." },
      { "href": "/developments/dubai-hills-mansion", "image": "/legacy/assets/images/library/high-rise-apartment-buildings-in-downtown-vancouve-2026-03-20-04-35-07-utc.jpg", "title": "Villa 24", "copy": "A mansion-scale residence where garden arrival, private wellness and long-horizon family living are composed as one." }
    ],
    "heroVideo": "/videos/hero-experience-center.mp4",
    "introHeading": "Turning Challenge\nInto Value",
    "introParagraphs": [
      "As the first Japanese developer in the UAE, Kasumigaseki Properties Development is the development arm of Kasumigaseki Capital, a public Tokyo-listed company. It introduces a distinctive approach to real estate: a promise of a higher standard of life. Driven by a commitment to superior quality, we believe meaningful developments begin with a deep respect for their environment, context, and community.",
      "From refined craftsmanship and forward-thinking innovation to thoughtful guardianship, we uphold rigorous standards at every stage, creating spaces that stand the test of time."
    ],
    "developmentHeading": "Different places. One standard.",
    "contactHeading": "Visit the Experience Centre",
    "contactText": "Some things are best understood in person. At the Kasumigaseki Properties Development Experience Center you can handle the finishes, walk the model and talk through the project with the people who shaped it."
  }$json$::jsonb,
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, "updatedAt" = NOW();

COMMIT;

-- Verification: both keys should appear exactly once.
SELECT key, value FROM site_settings WHERE key IN ('global', 'home') ORDER BY key;
