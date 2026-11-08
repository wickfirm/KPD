import type { ReactNode } from "react";

/// Inline emphasis for CMS plain text, "Gallery light" style: **bold** renders
/// as <strong>, [[soft]] renders as a muted .soft span, and line breaks become
/// <br>. Everything else passes through verbatim, so unclosed markers are safe.
export function emphasisNodes(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[\[([^\]]+)\]\]|\r?\n/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value)) !== null) {
    if (match.index > last) nodes.push(value.slice(last, match.index));
    if (match[1] !== undefined) nodes.push(<strong key={key++}>{match[1]}</strong>);
    else if (match[2] !== undefined) nodes.push(<span className="soft" key={key++}>{match[2]}</span>);
    else nodes.push(<br key={key++} />);
    last = pattern.lastIndex;
  }
  if (last < value.length) nodes.push(value.slice(last));
  return nodes;
}
