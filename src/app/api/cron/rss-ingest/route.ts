import { NextRequest, NextResponse } from "next/server";
import { ingestFeeds } from "@/lib/rss";

/// Vercel Cron entrypoint — pulls Google News + GDELT matches for the KPD
/// keyword set into the moderation queue. Secured with CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ingestFeeds();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
