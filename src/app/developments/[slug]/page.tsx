import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

type ModuleContent = { text?: string; images?: string[]; items?: { label?: string; value?: string; text?: string; image?: string; url?: string }[]; url?: string };
function content(value: unknown) { return (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as ModuleContent; }

export const dynamic = "force-dynamic";

export default async function DevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await db.project.findFirst({ where: { slug, status: "PUBLISHED", profile: "FULL" }, include: { modules: { where: { profile: "FULL" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } });
  if (!project) notFound();

  return <main className="kpd-project-template">
    <nav className="kpd-project-nav"><Link href="/legacy/index.html">KPD</Link><Link href="/legacy/index.html#development-cards">Developments</Link><Link href="/legacy/contact.html">Contact</Link></nav>
    <header className="kpd-project-hero" style={project.heroImage ? { backgroundImage: `linear-gradient(90deg, rgba(10,15,20,.74), rgba(10,15,20,.15)), url(${project.heroImage})` } : undefined}>
      <div><p>{project.location ?? "Kasumigaseki Properties Development"}</p><h1>{project.name}</h1>{project.tagline ? <h2>{project.tagline}</h2> : null}{project.description ? <p>{project.description}</p> : null}<Link href={`/legacy/contact.html?project=${encodeURIComponent(project.name)}`}>Arrange a private viewing</Link></div>
    </header>
    {project.modules.map((module) => { const data = content(module.content); return <section key={module.id} className={`kpd-project-module kpd-project-module--${module.kind.toLowerCase()}`}>
      <h2>{module.title}</h2>{data.text ? <p>{data.text}</p> : null}
      {data.images?.length ? <div className="kpd-project-gallery">{data.images.map((image) => <img key={image} src={image} alt={`${project.name} — ${module.title}`} />)}</div> : null}
      {data.items?.length ? <div className="kpd-project-items">{data.items.map((item, index) => <article key={`${item.label}-${index}`}>{item.image ? <img src={item.image} alt={item.label ?? module.title} /> : null}<strong>{item.label ?? item.text}</strong>{item.value ? <span>{item.value}</span> : null}{item.url ? <a href={item.url}>View details</a> : null}</article>)}</div> : null}
      {data.url ? <p><a className="kpd-project-link" href={data.url} target={module.kind === "VIDEO" ? "_blank" : undefined} rel={module.kind === "VIDEO" ? "noreferrer" : undefined}>{module.kind === "BROCHURE" ? "Download brochure" : module.kind === "VIDEO" ? "Watch video" : "Open resource"}</a></p> : null}
    </section>; })}
    <section className="kpd-project-enquire"><h2>Interested in {project.name}?</h2><p>Floor plans, availability, and a private appointment are available on request.</p><Link href={`/legacy/contact.html?project=${encodeURIComponent(project.name)}`}>Register interest</Link></section>
  </main>;
}
