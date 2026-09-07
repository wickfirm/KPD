// Seed: initial CMS content.
// - Migrates the hardcoded articles from the delivered assets/js/articles.js
// - Creates the three live developments with their project modules
// - Creates placeholder CMS pages (FAQ / Privacy / Terms)
// Run: npm run db:seed
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const articles = [
  {
    slug: "design-underwriting-endurance",
    kind: "NEWS" as const,
    date: new Date("2026-06-10"),
    title: "Design, Underwriting & Endurance Forum",
    summary:
      "A closed-room discussion on land logic, delivery discipline, design intent, and how long-horizon value is protected before a project reaches market.",
    image: "/legacy/assets/images/library/bottom-up-view-of-modern-office-building-in-hong-k-2026-03-26-06-21-57-utc.jpg",
    imageAlt: "Dubai financial district and real estate context",
    body: [
      "KPD convened a focused forum around the relationship between design, underwriting, and long-term project relevance. The conversation centered on how early feasibility decisions shape every later layer of a development, from frontage and arrival to operations, maintenance, leasing, and resale confidence.",
      "The session treated design as a commercial discipline rather than a decorative layer. Participants discussed why enduring residential value depends on a project being clear about its audience, its service logic, its public edges, and the daily routines it supports.",
      "For KPD, this is where development begins: with the patience to test assumptions, the restraint to avoid unnecessary complexity, and the discipline to make places that remain useful and memorable beyond launch.",
    ],
  },
  {
    slug: "seven-x-seven-project-note",
    kind: "NEWS" as const,
    date: new Date("2026-06-01"),
    title: "Seven X Seven: A Denser Urban Brief",
    summary:
      "A sharper urban mixed-use brief built around positioning, movement, and future delivery logic.",
    image: "/legacy/assets/images/project-media/sxs/facade%20left%202.png",
    imageAlt: "Seven X Seven facade render",
    body: [
      "Seven X Seven is shaped around an urban reading of density, frontage, and movement. The project is positioned to make its address, arrival sequence, and residential experience feel coherent from the street to the private interior.",
      "Rather than relying on scale alone, the project uses measured facade rhythm, amenity logic, and material restraint to create a residential experience that is composed and commercially legible.",
      "The development reflects KPD's wider approach: every spatial decision should carry operational, experiential, and long-term value.",
    ],
  },
  {
    slug: "emerald-villa-private-preview",
    kind: "NEWS" as const,
    date: new Date("2026-05-22"),
    title: "Emerald Villa Private Preview",
    summary:
      "An invitation-only preview of Emerald Villa's planning, amenity story, and garden-led residential experience.",
    image: "/legacy/assets/images/project-media/Emerald%20Villa/12_2.jpg",
    imageAlt: "Emerald Villa exterior arrival",
    body: [
      "Emerald Villa was presented through a private preview focused on the relationship between arrival, landscape, privacy, and interior calm. The walkthrough introduced the project as a residential environment shaped for family-scaled living and long-horizon ownership.",
      "The preview highlighted the role of garden rooms, shaded outdoor areas, and warm interior materiality in creating a home that feels generous without becoming performative.",
      "KPD's team framed the project as a quieter expression of luxury: one built around clarity, daily use, and a composed sense of permanence.",
    ],
  },
  {
    slug: "land-logic-before-form",
    kind: "BLOG" as const,
    date: new Date("2026-05-10"),
    title: "Land Logic Before Form",
    summary:
      "Why site constraints, arrival, frontage, and address behavior shape a development long before architecture is drawn.",
    image: "/legacy/assets/images/blog/blog-4.jpg",
    imageAlt: "Aerial site planning context",
    body: [
      "Every development begins with land, and land always speaks first. Before massing, materiality, or marketing, the site defines what arrival feels like, where the sun sits, how frontage behaves, and what the address will mean in ten years.",
      "Constraints are not obstacles to design; they are the beginning of it. A plot that demands patience usually rewards it, shaping projects that remain relevant beyond launch cycles.",
      "Form refined by land logic does not limit ambition; it can refine a proposition that already understands its place.",
    ],
  },
  {
    slug: "what-makes-yield-durable",
    kind: "BLOG" as const,
    date: new Date("2026-04-28"),
    title: "What Makes Yield Durable",
    summary:
      "A note on rental readiness, service-charge discipline, and product features that remain relevant beyond launch.",
    image: "/legacy/assets/images/blog/blog-5.jpg",
    imageAlt: "Residential landscape and market context",
    body: [
      "Yield durability is rarely created by one headline number. It is built through a sequence of small decisions that make a property easy to understand, easy to operate, and easy to live in.",
      "Rental readiness depends on product clarity, furnishing logic, maintenance discipline, and amenities that support real routines rather than marketing lists. Service-charge control matters because it protects the net experience for owners and tenants alike.",
      "The strongest projects remain legible after launch. They offer a clear reason to be chosen again, not just a reason to be noticed once.",
    ],
  },
  {
    slug: "quiet-architecture",
    kind: "BLOG" as const,
    date: new Date("2026-04-12"),
    title: "Quiet Architecture",
    summary:
      "How restraint, material clarity, and practical operations can create a stronger residential experience.",
    image: "/legacy/assets/images/blog/blog-6.jpg",
    imageAlt: "Modern facade and residential materiality",
    body: [
      "Quiet architecture does not mean passive architecture. It means design that knows when to hold back, when to frame, and when to let daily life take priority.",
      "In residential development, restraint can be a form of confidence. Clear materials, controlled light, practical circulation, and durable details often create a stronger experience than excessive visual noise.",
      "For KPD, the aim is not to make buildings that shout at first glance. It is to make places that continue to feel considered after years of use.",
    ],
  },

];

async function main() {
  console.log("Seeding articles…");
  for (const a of articles) {
    await db.article.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        slug: a.slug,
        kind: a.kind,
        title: a.title,
        summary: a.summary,
        body: a.body,
        coverImage: a.image,
        coverImageAlt: a.imageAlt,
        status: "PUBLISHED",
        publishedAt: a.date,
      },
    });
  }

  console.log("Seeding developments…");
  const projects = [
    {
      slug: "seven-x-seven",
      name: "Seven X Seven",
      tagline: "A denser urban brief",
      location: "Dubai",
      heroImage: "/legacy/assets/images/project-media/sxs/facade%20front%202.png",
      sortOrder: 1,
      modules: [
        {
          slug: "gallery",
          title: "Facade Gallery",
          kind: "GALLERY" as const,
          content: { images: ["/legacy/assets/images/project-media/sxs/facade%20left%202.png"] },
        },
      ],
    },
    {
      slug: "emerald-villa",
      name: "Emerald Villa",
      tagline: "A garden-led residential environment",
      location: "Dubai",
      heroImage: "/legacy/assets/images/project-media/Emerald%20Villa/13_2.jpg",
      sortOrder: 2,
      modules: [
        {
          slug: "gallery",
          title: "Arrival & Interiors",
          kind: "GALLERY" as const,
          content: { images: ["/legacy/assets/images/project-media/Emerald%20Villa/12_2.jpg"] },
        },
      ],
    },
    {
      slug: "dubai-hills-mansion",
      name: "Dubai Hills Mansion",
      tagline: "A private estate address",
      location: "Dubai Hills Estate",
      heroImage:
        "/legacy/assets/images/project-media/Dubai%20Hills%20Mansion/6_plex_front_rev_final_1.jpg",
      sortOrder: 3,
      modules: [],
    },
  ];

  for (const p of projects) {
    await db.project.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        location: p.location,
        heroImage: p.heroImage,
        sortOrder: p.sortOrder,
        status: "PUBLISHED",
        publishedAt: new Date(),
        modules: { create: p.modules },
      },
    });
  }

  console.log("Seeding CMS pages…");
  const pages = [
    { slug: "faq", title: "Frequently Asked Questions" },
    { slug: "privacy-policy", title: "Privacy Policy" },
    { slug: "terms", title: "Terms & Conditions" },
  ];
  for (const p of pages) {
    await db.staticPage.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        content: [
          {
            type: "paragraph",
            text:
              p.slug === "faq"
                ? "Placeholder — FAQ copywriting to be produced during Phase 4 (content population)."
                : "Placeholder — final text to be supplied by the client's legal counsel (Clause 3) and wired through the CMS (Clause 2).",
          },
        ],
        status: "DRAFT",
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

