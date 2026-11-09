import { describe, expect, it } from "vitest";
import { resolveHeroMedia } from "./home-defaults";

describe("resolveHeroMedia", () => {
  const both = { heroVideo: "/v.mp4", heroImage: "/i.webp" };
  it("keeps the original video-with-poster behaviour when nothing is chosen", () => {
    expect(resolveHeroMedia(both)).toEqual({ video: "/v.mp4", image: "/i.webp" });
  });
  it("shows only the image when Image is chosen", () => {
    expect(resolveHeroMedia({ ...both, heroMediaType: "image" })).toEqual({ image: "/i.webp" });
  });
  it("falls back to the video when Image is chosen but empty", () => {
    expect(resolveHeroMedia({ heroMediaType: "image", heroVideo: "/v.mp4", heroImage: " " })).toEqual({ video: "/v.mp4" });
  });
  it("falls back to the image when Video is chosen but empty", () => {
    expect(resolveHeroMedia({ heroMediaType: "video", heroVideo: "", heroImage: "/i.webp" })).toEqual({ image: "/i.webp" });
  });
  it("returns nothing when both are empty", () => {
    expect(resolveHeroMedia({ heroMediaType: "image" })).toEqual({});
  });
});
