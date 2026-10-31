import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { OG_COLORS as C, OG_SIZE, OgFrame, ogFonts } from "@/lib/og";

export const alt = `${site.name} — ${site.role}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgFrame eyebrow="PORTFOLIO — V2.0" footer={site.url.replace(/^https?:\/\//, "").toUpperCase()}>
        <div style={{ display: "flex", fontSize: 168, lineHeight: 0.84, letterSpacing: -6, textTransform: "uppercase" }}>
          {site.firstName}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 40, color: C.signal, maxWidth: 520, lineHeight: 1.05 }}>
            Software engineer crafting fast, accessible interfaces.
          </div>
          <div style={{ display: "flex", fontSize: 168, lineHeight: 0.84, letterSpacing: -6, textTransform: "uppercase" }}>
            {site.lastName}
          </div>
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
