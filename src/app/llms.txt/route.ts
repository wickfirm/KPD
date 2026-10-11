import { db } from "@/lib/db";
import { buildLlmsTxt } from "@/lib/llms";

export const revalidate = 3600;

/// /llms.txt: a plain-text map of the site for AI assistants and answer
/// engines. A database problem degrades to the fixed pages instead of an error.
export async function GET() {
  let projects: { slug: string; name: string; tagline: string | null; description: string | null }[] = [];
  let articles: { slug: string; title: string; summary: string }[] = [];
  try {
    [projects, articles] = await Promise.all([
      db.project.findMany({
        where: { status: "PUBLISHED", profile: "FULL" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { slug: true, name: true, tagline: true, description: true },
      }),
      db.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: { slug: true, title: true, summary: true },
      }),
    ]);
  } catch {
    // keep the fixed pages
  }
  return new Response(buildLlmsTxt({ projects, articles }), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
