// Guards the client's delivered stylesheet: public/legacy/assets/css/site.css must stay
// exactly as supplied (no edits, no byte-order mark). CMS-only CSS belongs in public.css or
// its own file (see AGENTS.md). Runs before every build ("prebuild" in package.json) and in
// the unit tests. If the client ever supplies a new stylesheet, replace site.css and update
// scripts/delivered-css.sha256 with: node scripts/check-delivered-css.mjs --print-hash
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SITE_CSS = new URL("../public/legacy/assets/css/site.css", import.meta.url);
const HASH_FILE = new URL("./delivered-css.sha256", import.meta.url);

const normalise = (buffer) => Buffer.from(buffer.toString("latin1").replace(/\r\n/g, "\n"), "latin1");

/// SHA-256 of a stylesheet with Windows line endings folded to LF (git may check files out either way).
const hashOf = (buffer) => createHash("sha256").update(normalise(buffer)).digest("hex");

/// null when the stylesheet is exactly the delivered one, otherwise why not.
export function deliveredCssProblem(buffer, expectedHash) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return "site.css starts with a byte-order mark; the delivered file has none.";
  }
  return hashOf(buffer) === expectedHash ? null : "site.css differs from the delivered stylesheet. Revert the edit; put CMS-only CSS in public.css or its own file.";
}
deliveredCssProblem.hashOf = hashOf;

export function expectedDeliveredCssHash() {
  return readFileSync(HASH_FILE, "utf8").trim().split(/\s+/)[0];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = readFileSync(SITE_CSS);
  if (process.argv.includes("--print-hash")) {
    console.log(`${hashOf(file)}  public/legacy/assets/css/site.css`);
  } else {
    const problem = deliveredCssProblem(file, expectedDeliveredCssHash());
    if (problem) { console.error(`\n[check-delivered-css] ${problem}\n`); process.exit(1); }
    console.log("[check-delivered-css] site.css is exactly as delivered.");
  }
}
