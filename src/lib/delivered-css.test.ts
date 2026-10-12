import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// Plain ES module, shared with the prebuild script.
import { deliveredCssProblem, expectedDeliveredCssHash } from "../../scripts/check-delivered-css.mjs";

const css = (text: string) => Buffer.from(text, "utf8");

describe("deliveredCssProblem", () => {
  const original = css("@import url(x);\n:root { --a: 1; }\n");
  const hash = deliveredCssProblem.hashOf(original);

  it("accepts the delivered stylesheet, whatever the line-ending style", () => {
    expect(deliveredCssProblem(original, hash)).toBeNull();
    expect(deliveredCssProblem(css("@import url(x);\r\n:root { --a: 1; }\r\n"), hash)).toBeNull();
  });
  it("rejects a byte-order mark", () => {
    expect(deliveredCssProblem(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), original]), hash)).toMatch(/byte-order mark/i);
  });
  it("rejects any edit", () => {
    expect(deliveredCssProblem(css("@import url(x);\n:root { --a: 2; }\n"), hash)).toMatch(/differs from the delivered/i);
  });
});

describe("the repo's site.css", () => {
  it("is exactly the stylesheet the client delivered", () => {
    const file = readFileSync(new URL("../../public/legacy/assets/css/site.css", import.meta.url));
    expect(deliveredCssProblem(file, expectedDeliveredCssHash())).toBeNull();
  });
});
