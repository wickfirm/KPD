import Link from "next/link";
import { notFound } from "next/navigation";
import { DevelopmentModule } from "@/components/public/development-template";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await db.project.findFirst({ where: { slug, status: "PUBLISHED", profile: "FULL" }, include: { modules: { where: { profile: "FULL" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } });
  if (!project) notFound();
  return <div className="single-project-page"><div className="single-project-main" id="top"><section className="single-project-hero pdf-hero" aria-label={`${project.name} introduction`}>{project.heroImage ? <img src={project.heroImage} alt={`${project.name} exterior`} /> : null}<div className="page-hero-content"><h1>{project.name}</h1></div></section><section className="single-project-intro kpd-section" id="overview"><div className="single-project-intro-grid single-project-intro-grid--pdf"><figure className="single-project-sketch single-project-intro-media">{project.heroImage ? <img src={project.heroImage} alt={`${project.name} visual`} /> : null}</figure><div className="single-project-intro-copy"><h1>{project.tagline ?? project.name}</h1>{project.description ? <p>{project.description}</p> : null}<div className="single-project-actions"><a className="btn-pill" href="#modules">Explore</a><Link className="btn-pill" href={`/legacy/contact.html?project=${encodeURIComponent(project.name)}`}>Brochure</Link></div></div></div></section><div id="modules">{project.modules.map((module) => <DevelopmentModule key={module.id} module={module} projectName={project.name} />)}</div><section className="projects-spec-contact single-project-enquire" aria-label={`Enquire about ${project.name}`}>{project.heroImage ? <img src={project.heroImage} alt="" /> : null}<div className="projects-spec-contact-copy"><span>Enquire</span><h2>Arrange a private<br />viewing.</h2><p>Floor plans, availability, and a project conversation are available by appointment.</p><div className="projects-spec-contact-actions"><Link href={`/legacy/contact.html?project=${encodeURIComponent(project.name)}`}>Register interest</Link></div></div></section></div></div>;
}
