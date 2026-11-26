import { describe, expect, it, vi } from "vitest";

// store.ts pulls in the Prisma singleton and the request helpers; the pure
// functions tested here touch neither, so stub the database.
vi.mock("@/lib/db", () => ({ db: {} }));

import { localizedModule } from "./store";

describe("localizedModule", () => {
  // The browser test of the editors caught this one: the function used to look
  // the language up inside an entry that was already the language's own, so a
  // section's translation was stored and never shown.
  it("lays the language's own entry of a section over its title and text", () => {
    const section = { id: "m1", slug: "residences", title: "The residences", content: { text: "City access and natural sanctuary.", images: ["/a.jpg"], url: "/contact" } };
    expect(localizedModule(section, { title: "المساكن", content: { text: "الوصول إلى المدينة." } })).toEqual({
      ...section,
      title: "المساكن",
      content: { ...section.content, text: "الوصول إلى المدينة." },
    });
  });

  it("leaves the section as it is without an entry, or with an empty one", () => {
    const section = { title: "The residences", content: { text: "City access." } };
    expect(localizedModule(section, undefined)).toEqual(section);
    expect(localizedModule(section, null)).toEqual(section);
    expect(localizedModule(section, {})).toEqual(section);
    expect(localizedModule(section, { content: { text: "   " } })).toEqual(section);
  });

  it("never lets a section's translation reach its pictures or links", () => {
    const section = { title: "The residences", content: { text: "City access.", images: ["/a.jpg"], url: "/contact", ctaVisible: false } };
    const sneaked = { content: { text: "الوصول إلى المدينة.", images: ["https://evil.example/a.jpg"], url: "https://evil.example", ctaVisible: true }, slug: "changed" };
    expect(localizedModule(section, sneaked)).toEqual({ ...section, content: { ...section.content, text: "الوصول إلى المدينة." } });
  });
});
