/// Normalise Windows line endings in HTML that is injected with
/// `dangerouslySetInnerHTML`. Browsers fold CRLF to LF while parsing the
/// server HTML, so a string that still contains `\r\n` never equals the DOM
/// React hydrates against (production error #418).
export function htmlLf(html: string): string {
  return html.replace(/\r\n?/g, "\n");
}
