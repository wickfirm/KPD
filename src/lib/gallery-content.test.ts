import { describe, expect, it } from "vitest";
import { pairedGalleryContent, parseItemRow } from "./gallery-content";

describe("pairedGalleryContent", () => {
  it("keeps captions attached to their images", () => {
    const out = pairedGalleryContent("a.jpg\nb.jpg\nc.jpg", "Lobby | | | \nPool | | | \nRoof | | | ");
    expect(out.images).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
    expect(out.items.map((item) => item.label)).toEqual(["Lobby", "Pool", "Roof"]);
  });

  it("does not shift later captions when a middle image is left blank", () => {
    const out = pairedGalleryContent("a.jpg\n\nc.jpg", "Lobby | | | \nOrphan | | | \nRoof | | | ");
    expect(out.images).toEqual(["a.jpg", "c.jpg"]);
    expect(out.items.map((item) => item.label)).toEqual(["Lobby", "Roof"]);
  });

  it("keeps an empty caption in the middle so positions line up, and trims trailing ones", () => {
    const out = pairedGalleryContent("a.jpg\nb.jpg\nc.jpg", "Lobby | | | \n | | | \n | | | ");
    expect(out.items.map((item) => item.label)).toEqual(["Lobby"]);
    const mid = pairedGalleryContent("a.jpg\nb.jpg\nc.jpg", " | | | \nPool | | | \nRoof | | | ");
    expect(mid.items.map((item) => item.label)).toEqual(["", "Pool", "Roof"]);
  });

  it("handles fewer captions than images and CRLF input", () => {
    const out = pairedGalleryContent("a.jpg\r\nb.jpg", "Lobby | | | ");
    expect(out.images).toEqual(["a.jpg", "b.jpg"]);
    expect(out.items.map((item) => item.label)).toEqual(["Lobby"]);
  });

  it("returns nothing for an empty gallery", () => {
    expect(pairedGalleryContent("", "")).toEqual({ images: [], items: [] });
  });
});

describe("parseItemRow", () => {
  it("parses label, value, image and link", () => {
    expect(parseItemRow("A | B | /x.png | https://e.com")).toEqual({ label: "A", value: "B", image: "/x.png", url: "https://e.com" });
  });
});
