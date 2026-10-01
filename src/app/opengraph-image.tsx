import { ImageResponse } from "next/og";

export const alt = "Kasumigaseki Properties Development — disciplined, long-horizon real estate in Dubai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/// Site-wide default social card. Used by every route that does not define its
/// own opengraph-image or supply article/development artwork in metadata.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050505",
          padding: "72px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 16, height: 16, background: "#c8a15a" }} />
          <div style={{ fontSize: 30, letterSpacing: 8, color: "#c8a15a" }}>KPD</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, lineHeight: 1.12, letterSpacing: 2 }}>Kasumigaseki</div>
          <div style={{ fontSize: 72, lineHeight: 1.12, letterSpacing: 2 }}>Properties Development</div>
        </div>
        <div style={{ fontSize: 30, color: "rgba(255,255,255,0.72)" }}>
          Disciplined, long-horizon real estate in Dubai
        </div>
      </div>
    ),
    size
  );
}
