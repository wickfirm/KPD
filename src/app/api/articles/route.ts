import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/// Public read API for published articles (news & blog).
/// GET /api/articles?kind=NEWS|BLOG&limit=20
export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 20) || 20, 100);

  const articles = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      ...(kind === "NEWS" || kind === "BLOG" ? { kind } : {}),
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: {
      slug: true,
      kind: true,
      title: true,
      summary: true,
      body: true,
      coverImage: true,
      coverImageAlt: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({ articles });
}
