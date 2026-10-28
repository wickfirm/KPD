import { absoluteUrl } from "./site";
import { SITE_NAME, clampDescription, developmentDescription, pageSeo } from "./seo";

type Dev = { slug: string; name: string; tagline?: string | null; description?: string | null };
type Article = { slug: string; title: string; summary: string };

/// The /llms.txt document: a short, plain-text guide to the site for AI
/// assistants and answer engines. Links and summaries only; every line comes
/// from the site's own pages.
export function buildLlmsTxt(input: { projects: Dev[]; articles: Article[]; email?: string }): string {
  const line = (label: string, path: string, text: string) => `- [${label}](${absoluteUrl(path)}): ${text}`;
  const parts: string[] = [
    `# ${SITE_NAME} (KPD)`,
    "",
    `> ${pageSeo.home.description}`,
    "",
    "## Key pages",
    line("About", pageSeo.about.path, pageSeo.about.description),
    line("Our legacy", pageSeo.legacy.path, pageSeo.legacy.description),
    line("Investor guide", pageSeo.invest.path, pageSeo.invest.description),
    line("Contact", pageSeo.contact.path, pageSeo.contact.description),
    line("News and updates", pageSeo.news.path, pageSeo.news.description),
  ];
  if (input.projects.length) {
    parts.push("", "## Developments", ...input.projects.map((project) => line(project.name, `/developments/${project.slug}`, developmentDescription(project))));
  }
  if (input.articles.length) {
    parts.push("", "## Latest news", ...input.articles.map((article) => line(article.title, `/news/${article.slug}`, clampDescription(article.summary) || article.title)));
  }
  if (input.email) parts.push("", "## Contact", `- ${input.email}`, "");
  return `${parts.join("\n")}\n`;
}
