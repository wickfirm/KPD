import { DevelopmentMain, type DevelopmentProject } from "./development-page";
import { DevelopmentMainG21 } from "./development-g21";
import { galleryLightDevelopments } from "@/lib/development-gallery-light";
import { SiteShellHeader } from "./site-shell-header";
import { SiteShellFooter } from "./site-shell-footer";
import { DeliveredScripts, DeliveredEarlyScripts } from "./delivered-scripts";
import { DeliveredBodyClass } from "./delivered-body-class";
import { genericProjectShell, getProjectShell } from "@/lib/legacy-project";
import { loadInvestPage } from "@/lib/invest-page";
import { mergeInvestContent } from "@/lib/invest-defaults";
import { developmentSectionPage } from "@/lib/section-visibility";
import { loadHiddenSections } from "@/lib/section-visibility-store";

/// A complete development page (delivered shell + the project's CMS content).
/// Shared by the public route and the admin draft preview so the preview is
/// exactly what visitors will see.
export async function DevelopmentView({ project, previewNote }: { project: DevelopmentProject; previewNote?: string }) {
  // Developments created in the CMS have no delivered template: use the generic shell.
  const shell = getProjectShell(project.slug) ?? genericProjectShell(project);
  // The calculator wording is edited on the investor guide and shared here.
  const [{ saved }, hidden] = await Promise.all([loadInvestPage(), loadHiddenSections(developmentSectionPage(project.id))]);
  const calculator = mergeInvestContent(saved).calculator;
  return <>
    {previewNote ? <div role="status" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 9999, padding: "10px 16px", background: "#14241f", color: "#fff", font: "600 13px/1.4 system-ui, sans-serif", textAlign: "center" }}>{previewNote}</div> : null}
    <DeliveredBodyClass bodyClass="home-development-page single-project-page" />
    <SiteShellHeader />
    {galleryLightDevelopments.has(project.slug) ? <DevelopmentMainG21 project={project} calculator={calculator} hidden={hidden} /> : <DevelopmentMain project={project} shell={shell} calculator={calculator} hidden={hidden} />}
    <SiteShellFooter />
    <DeliveredEarlyScripts />
    <DeliveredScripts bodyClass="home-development-page single-project-page" sources={["/legacy/assets/js/mortgage-calculator.js?v=20261005-2"]} />
  </>;
}
