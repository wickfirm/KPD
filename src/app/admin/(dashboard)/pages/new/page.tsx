import Link from "next/link";
import StaticPageForm from "../page-form";

export default function NewPage() {
  return <><div className="cms-actions" style={{ justifyContent: "space-between", marginBottom: 20 }}><h1 style={{ margin: 0 }}>Create page</h1><Link className="cms-btn cms-btn--ghost" href="/admin/pages">Back</Link></div><div className="cms-card"><StaticPageForm /></div></>;
}
