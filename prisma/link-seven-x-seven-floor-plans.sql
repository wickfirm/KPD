-- Run once in the Supabase SQL Editor after all 13 PDF and JPG assets have
-- been uploaded to the CMS media library. This preserves every other field in
-- the Seven x Seven Floor Plans module and replaces only its ordered cards.
UPDATE project_modules
SET content = content || jsonb_build_object('items', $json$
[
  {
    "label": "1 Bedroom · Type A",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/93212000-a9af-4000-b322-9299fb9d9f0d.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/649e6d51-4ddf-47de-b928-a31615f1d22a.pdf"
  },
  {
    "label": "2 Bedroom · Type A",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/a35f64d4-b246-475d-970b-fc29b3045035.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/ade093f3-c4e2-4de5-b399-7483e5c753eb.pdf"
  },
  {
    "label": "2 Bedroom · Type AA",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/d76c7468-b3cf-4fec-912e-cae8d9c17564.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/ea859304-06a3-41ca-b549-8636396042c0.pdf"
  },
  {
    "label": "2 Bedroom · Type B",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/94ef1a50-6d32-4b0f-ae0e-e3c860ec47c7.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/acde93c5-918e-4570-9e64-bc95b313c328.pdf"
  },
  {
    "label": "2 Bedroom · Type BB",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/3f3f9c14-9ccb-43fc-8ac9-a14fac5262da.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/44af5205-6173-4581-9f04-64cfefbff149.pdf"
  },
  {
    "label": "2 Bedroom · Type C",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/ccc6c6c1-2543-4689-991f-ebcd195bf2c5.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/ef03ffee-6b16-438d-809b-ef52e0ce2c4d.pdf"
  },
  {
    "label": "2 Bedroom · Type CC",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/5a58f6a0-a8bf-44f6-afe9-86bd184d174e.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/ab8d80cf-2a84-4c74-bb33-04171ecf0c94.pdf"
  },
  {
    "label": "2 Bedroom · Type D",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/559f7cc7-afea-4d86-acfa-e80f92dd33d7.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/252c4e50-bf2a-4e37-9add-2fa508d79522.pdf"
  },
  {
    "label": "2 Bedroom · Type E",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/ed54bf14-821a-4081-815f-2a07a747d6cc.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/6f1f3f4d-1f91-45f1-8a96-ec6514e10e01.pdf"
  },
  {
    "label": "2 Bedroom · Type F",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/a686e541-b146-4d9f-9916-77faab03f976.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/9daf6bd0-fdb8-425b-b2b1-dd923e9c4488.pdf"
  },
  {
    "label": "3 Bedroom · Type A",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/9905dcee-bfb8-4b15-89e0-5151e9c02ab3.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/57e95c4f-c41a-4caf-a048-b4d7a6e0801a.pdf"
  },
  {
    "label": "3 Bedroom · Type B",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/ce00f705-6c74-4be6-9011-a1bb2a2c1efd.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/99aec975-5445-434e-8c9c-b2048e034772.pdf"
  },
  {
    "label": "4 Bedroom · Penthouse",
    "image": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/72ec80b7-2c71-447b-b232-6490d6fbaba2.jpg",
    "url": "https://pub-247a3b62a8e44db0b020cc0cbc2e3f98.r2.dev/cms/2026-10-20/efd50849-c840-431c-9810-07822c76eb4e.pdf"
  }
]
$json$::jsonb),
"updatedAt" = NOW()
WHERE "projectId" = 'kpd_prj_01'
  AND slug = 'floor-plans';
