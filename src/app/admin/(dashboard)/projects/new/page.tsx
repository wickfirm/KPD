import Link from "next/link";
import ProjectForm from "../project-form";

export default function NewProjectPage() {
  return <>
    <div className="cms-page-heading">
      <div>
        <span className="cms-eyebrow">Properties</span>
        <h1>New development</h1>
        <p>Give it a name and an image, and start with the standard sections. It stays a draft until you publish it.</p>
      </div>
      <Link className="cms-btn cms-btn--ghost" href="/admin/projects">Back to developments</Link>
    </div>
    <div className="cms-card"><ProjectForm /></div>
  </>;
}
