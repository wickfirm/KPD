import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteStaticPage } from "../../actions";
import StaticPageForm from "../page-form";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await db.staticPage.findUnique({ where: { id } });
  if (!page) notFound();
  return <><div className="cms-actions" style={{ justifyContent: "space-between", marginBottom: 20 }}><h1 style={{ margin: 0 }}>Edit page</h1><div className="cms-actions"><Link className="cms-btn cms-btn--ghost" href="/admin/pages">Back</Link><form action={deleteStaticPage}><input type="hidden" name="id" value={page.id} /><button type="submit" className="cms-btn cms-btn--danger">Delete</button></form></div></div><div className="cms-card"><StaticPageForm defaults={{ ...page, content: page.content as { type?: string; heading?: string; text?: string; image?: string; ctaLabel?: string; ctaUrl?: string }[] }} /></div></>;
}
