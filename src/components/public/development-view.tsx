import { DevelopmentMain, type DevelopmentProject } from "./development-page";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";
import { genericProjectShell, getProjectShell } from "@/lib/legacy-project";
import { ownershipCostPlannerDefaults, renderPlannerHtml } from "@/lib/ownership-cost-planner";

/// A complete development page (delivered shell + the project's CMS content).
/// Shared by the public route and the admin draft preview so the preview is
/// exactly what visitors will see.
export function DevelopmentView({ project, previewNote }: { project: DevelopmentProject; previewNote?: string }) {
  // Developments created in the CMS have no delivered template: use the generic shell.
  const shell = getProjectShell(project.slug) ?? genericProjectShell(project);
  const hasPlanner = ownershipCostPlannerDefaults.projects.some((entry) => entry.slug === project.slug);
  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass="home-development-page single-project-page" />
    <SiteShellHeader />
    <DevelopmentMain project={project} shell={shell} plannerHtml={hasPlanner ? renderPlannerHtml(true, project.slug) : ""} />
    <SiteShellFooter />
    <DeliveredScripts bodyClass="home-development-page single-project-page" sources={["/legacy/assets/js/ownership-cost-planner.js?v=20260929"]} />
  </>;
}
