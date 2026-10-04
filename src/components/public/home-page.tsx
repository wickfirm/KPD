import type { ReactNode } from "react";
import Link from "next/link";
import { homeDefaults, type GalleryPanel, type HomeSettings } from "@/lib/home-defaults";

/// Newlines in editor content render as <br>, matching the delivered markup.
function multiline(value: string): ReactNode[] {
  return value.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={index} />, line]));
}

/// The delivered development banner slides — static presentation media.
const bannerSlides = [
  "/legacy/assets/images/project-media/sxs/facade%20left%202.png",
  "/legacy/assets/images/project-media/Emerald%20Villa/tm2161_vp29_interior_3brmasterbedroom_rev06.jpg",
  "/legacy/assets/images/library/driveway-of-a-contemporary-house-with-a-garden-are-2026-01-08-00-24-21-utc.jpg",
  "/legacy/assets/images/library/modern-apartment-buildings-with-balconies-on-sunny-2026-03-19-09-29-37-utc.jpg",
  "/legacy/assets/images/library/dubai-marina-skyline-with-modern-skyscrapers-and-w-2026-03-05-11-49-49-utc.jpg",
];

const bannerDots = [
  "Show Seven X Seven",
  "Show Emerald Villa",
  "Show Dubai Hills Mansion",
  "Show residential development",
  "Show Dubai skyline",
];

/// The delivered development cards (static marketing copy; projects are edited
/// under Developments in the CMS).
const developmentCards = [
  { href: "/developments/seven-x-seven", image: "/legacy/assets/images/project-media/sxs/facade%20right%202.png", alt: "Seven X Seven", title: "Seven X Seven", copy: "A composed Meydan Horizon residence shaped by arrival, light, privacy, and efficient access to Dubai's core districts." },
  { href: "/developments/emerald-villa", image: "/legacy/assets/images/project-media/Emerald%20Villa/37.jpg", alt: "Emerald Villa exterior", title: "Emerald Villa", copy: "A private villa composition shaped around garden arrival, layered privacy, and family-scaled living." },
  { href: "/developments/dubai-hills-mansion", image: "/legacy/assets/images/library/high-rise-apartment-buildings-in-downtown-vancouve-2026-03-20-04-35-07-utc.jpg", alt: "Dubai Hills Mansion exterior", title: "Dubai Hills Mansion", copy: "A mansion-scale residence organized around garden arrival, private wellness, and long-horizon family living." },
];

/// The delivered AUM stat strip (static figures).
const introStats = [
  { value: "$4.4B", label: "Global AUM" },
  { value: "$320M", label: "Dubai Real Estate" },
  { value: "$2.27B", label: "Logistics" },
  { value: "$1.64B", label: "Hotels" },
];

export function HomeHero({ video }: { video: string }) {
  return (
    <section className="pdf-section pdf-hero">
      <video src={video} autoPlay muted playsInline preload="auto" aria-label="KPD Experience Center presentation gallery" />
    </section>
  );
}

export function HomeIntro({ heading, paragraphs }: { heading: string; paragraphs: string[] }) {
  return (
    <section className="pdf-section pdf-intro" id="about">
      <div className="pdf-intro-grid">
        <h1>{multiline(heading)}</h1>
        <div className="pdf-intro-copy">
          {paragraphs.map((paragraph, index) => <p key={index}>{multiline(paragraph)}</p>)}
        </div>
      </div>
      <div className="pdf-stat-grid">
        {introStats.map((stat) => (
          <div className="pdf-stat" key={stat.label}><strong><Link href="/about">{stat.value}</Link></strong><span>{stat.label}</span></div>
        ))}
        <p className="stats-as-of">(As of February, 2026)</p>
      </div>
    </section>
  );
}

export function HomeDevelopmentBanner({ heading }: { heading: string }) {
  return (
    <section className="pdf-section pdf-development-banner" id="developments" data-development-slider>
      <div className="pdf-development-slides" aria-hidden="true">
        {bannerSlides.map((slide, index) => (
          <div className={`pdf-development-slide${index === 0 ? " active" : ""}`} key={slide}><img src={slide} alt="" /></div>
        ))}
      </div>
      <div className="pdf-development-content">
        <h2>{heading}</h2>
        <Link className="pdf-development-button btn-pill text-white" href="/#development-cards">Explore</Link>
        <div className="pdf-development-dots" aria-label="Development slides">
          {bannerDots.map((label, index) => (
            <button className={index === 0 ? "active" : undefined} type="button" data-development-dot={index} aria-label={label} key={label} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeDevelopmentCards() {
  return (
    <section className="pdf-section pdf-development-cards" id="development-cards" aria-label="Our developments">
      {developmentCards.map((card) => (
        <a className="pdf-dev-card" href={card.href} key={card.href}>
          <img src={card.image} alt={card.alt} />
          <div className="pdf-dev-card-body">
            <h3>{card.title}</h3>
            <p>{card.copy}</p>
            <span>Explore</span>
          </div>
        </a>
      ))}
    </section>
  );
}

export function HomeContactBlock({ heading, text }: { heading: string; text: string }) {
  return (
    <section className="pdf-section pdf-contact-block" id="contact">
      <div><h2>{multiline(heading)}</h2></div>
      <div className="pdf-contact-copy">
        <p>{multiline(text)}</p>
        <Link href="/contact#experience-center">Plan Visit</Link>
      </div>
    </section>
  );
}

/// The delivered gallery uses exactly five panels; the CMS editor enforces the
/// same count, so CMS images replace all five together.
export function HomeExperienceGallery({ images }: { images?: string[] }) {
  const panels: GalleryPanel[] = images?.length === 5
    ? images.map((image, index) => ({ key: `cms-${index + 1}`, image, caption: `Experience Center image ${index + 1}` }))
    : homeDefaults.galleryPanels;
  return (
    <section className="pdf-section pdf-vertical-gallery pdf-gallery-flex" id="experience-center" aria-label="Experience Center gallery" data-gallery-flex>
      {panels.map((panel) => (
        <button className="pdf-gallery-panel" type="button" data-gallery-panel={panel.key} data-lightbox-src={panel.image} data-lightbox-caption={panel.caption} key={panel.key}>
          <img src={panel.image} alt={panel.caption} />
        </button>
      ))}
    </section>
  );
}

/// The homepage <main>: CMS-managed sections render as React; the delivered
/// static tail (events, sunset band, live news, and the hidden legacy bands)
/// rides through unchanged inside a wrapper div.
export function HomeMain({ settings, staticTail }: { settings: HomeSettings; staticTail: string }) {
  return (
    <main className="development-pdf-home" id="top">
      <HomeHero video={settings.heroVideo ?? homeDefaults.heroVideo} />
      <HomeIntro
        heading={settings.introHeading ?? homeDefaults.introHeading}
        paragraphs={settings.introParagraphs?.length ? settings.introParagraphs : homeDefaults.introParagraphs}
      />
      <HomeDevelopmentBanner heading={settings.developmentHeading ?? homeDefaults.developmentHeading} />
      <HomeDevelopmentCards />
      <HomeContactBlock
        heading={settings.contactHeading ?? homeDefaults.contactHeading}
        text={settings.contactText ?? homeDefaults.contactText}
      />
      <HomeExperienceGallery images={settings.experienceImages} />
      <div className="pdf-static-tail" dangerouslySetInnerHTML={{ __html: staticTail }} />
    </main>
  );
}
