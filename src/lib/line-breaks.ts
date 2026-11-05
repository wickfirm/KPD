/// Headings can be written over several lines in the CMS; each line break becomes
/// a <br> on the page (as in the client's HTML). Browsers send Windows-style line
/// endings from a textarea, so tidy the text before it is stored: LF only, no
/// spaces around lines, no blank lines.
export function normalizeLineBreaks(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

/// Body copy is different: editors use blank lines for spacing on the page
/// (client feedback items 4 and 16), so unlike normalizeLineBreaks this keeps
/// every blank line — it only normalises the line endings and strips trailing
/// whitespace from each line, then trims the outer ends.
export function preserveLineBreaks(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .trim();
}
