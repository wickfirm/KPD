import { DevelopmentMain, type DevelopmentProject } from "./development-page";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";
import { genericProjectShell, getProjectShell } from "@/lib/legacy-project";

/// A complete development page (delivered shell + the project's CMS content).
/// Shared by the public route and the admin draft preview so the preview is
/// exactly what visitors will see.
export function DevelopmentView({ project, previewNote }: { project: DevelopmentProject; previewNote?: string }) {
  // Developments created in the CMS have no delivered template: use the generic shell.
  const shell = getProjectShell(project.slug) ?? genericProjectShell(project);
  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass="home-development-page single-project-page" />
    <SiteShellHeader />
    <DevelopmentMain project={project} shell={shell} />
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page single-project-page" sources={["/legacy/assets/js/mortgage-calculator.js?v=20261005-2"]} />
  </>;
}
