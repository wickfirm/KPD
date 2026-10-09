import type { ReactNode } from "react";
import { AutoSectionNav } from "./auto-section-nav";
import { UnsavedGuard } from "./unsaved-guard";

/// Common frame for long editors: the content in a main column, an automatic
/// "On this page" list beside it (stays in view while scrolling), and the
/// unsaved-changes bar with a leave-page warning. Wrap the editor card and
/// anything that should scroll with it; page headings stay outside.
export function EditorShell({ children }: { children: ReactNode }) {
  return <div className="cms-editor cms-editor-shell">
    <UnsavedGuard scope=".cms-editor-shell" />
    <div className="cms-editor-layout">
      <div className="cms-editor-layout__main">{children}</div>
      <AutoSectionNav />
    </div>
  </div>;
}
