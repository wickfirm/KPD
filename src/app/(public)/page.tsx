import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

type HomeContent = { heroVideo?: string; introHeading?: string; introParagraphs?: string[]; developmentHeading?: string; contactHeading?: string; contactText?: string; experienceImages?: string[] };
function isHomeContent(value: unknown): value is HomeContent { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }

export const dynamic = "force-dynamic";
export default async function HomePage() {
  let home: HomeContent | undefined;
  let projects: { slug: string; name: string; description: string | null; heroImage: string | null }[] = [];
  let articles: { slug: string; title: string; summary: string; coverImage: string | null; coverImageAlt: string | null }[] = [];
  try {
    const [setting, liveProjects, latestArticles] = await Promise.all([
      db.siteSetting.findUnique({ where: { key: "home" } }),
      db.project.findMany({ where: { status: "PUBLISHED", profile: "FULL" }, select: { slug: true, name: true, description: true, heroImage: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
      db.article.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, title: true, summary: true, coverImage: true, coverImageAlt: true }, orderBy: { publishedAt: "desc" }, take: 3 }),
    ]);
    if (isHomeContent(setting?.value)) home = setting.value;
    projects = liveProjects;
    articles = latestArticles;
  } catch {
    // The deployed legacy page remains available until database configuration
    // and the initial settings seed are complete.
  }
  if (!home) redirect("/legacy/index.html");

  return <div className="development-pdf-home" id="top">
    <section className="pdf-section pdf-hero">{home.heroVideo ? <video src={home.heroVideo} autoPlay muted playsInline preload="auto" aria-label="KPD presentation" /> : null}</section>
    <section className="pdf-section pdf-intro" id="about"><div className="pdf-intro-grid"><h1>{home.introHeading || "Turning Challenge Into Value"}</h1><div className="pdf-intro-copy">{(home.introParagraphs ?? []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></section>
    <section className="pdf-section pdf-development-banner" id="developments"><div className="pdf-development-slides">{projects.slice(0, 1).map((project) => project.heroImage ? <div className="pdf-development-slide active" key={project.slug}><img src={project.heroImage} alt="" /></div> : null)}</div><div className="pdf-development-content"><h2>{home.developmentHeading || "Our Developments"}</h2><a className="pdf-development-button btn-pill text-white" href="#development-cards">Explore</a></div></section>
    <section className="pdf-section pdf-development-cards" id="development-cards" aria-label="Our developments">{projects.map((project) => <Link className="pdf-dev-card" href={`/developments/${project.slug}`} key={project.slug}>{project.heroImage ? <img src={project.heroImage} alt={project.name} /> : null}<div className="pdf-dev-card-body"><h3>{project.name}</h3>{project.description ? <p>{project.description}</p> : null}<span>Explore</span></div></Link>)}</section>
    <section className="pdf-section pdf-contact-block" id="contact"><div><h2>{home.contactHeading || "A first point of contact"}</h2></div><div className="pdf-contact-copy"><p>{home.contactText}</p><Link href="/legacy/contact.html#experience-center">Plan Visit</Link></div></section>
    {home.experienceImages?.length ? <section className="pdf-section pdf-vertical-gallery pdf-gallery-flex" aria-label="Experience Center gallery">{home.experienceImages.map((image, index) => <div className={`pdf-gallery-panel${index === 0 ? " is-active" : ""}`} key={image}><img src={image} alt="KPD Experience Center" /></div>)}</section> : null}
    <section className="pdf-section pdf-events-head" id="news"><h2>Blogs and updates</h2><div><p>Announcements, market observations, and development commentary.</p><Link href="/legacy/news.html">Explore</Link></div></section>
    <section className="pdf-section pdf-events-grid" aria-label="Blogs and updates">{articles.map((article) => <article className="pdf-event-card" key={article.slug}>{article.coverImage ? <img src={article.coverImage} alt={article.coverImageAlt || article.title} /> : null}<h3>{article.title}</h3><p>{article.summary}</p><Link href={`/news/${article.slug}`}>Explore</Link></article>)}</section>
  </div>;
}
