import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { offerings, servicesIntro } from "@/content/services";
import { OG_COLORS as C, OG_SIZE, OgFrame, ogFonts } from "@/lib/og";

export const alt = `Services — ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgFrame eyebrow="SERVICES — OPEN FOR FREELANCE" footer={`${site.url.replace(/^https?:\/\//, "").toUpperCase()}/SERVICES`}>
        <div style={{ display: "flex", fontSize: 168, lineHeight: 0.84, letterSpacing: -6, textTransform: "uppercase" }}>Services</div>
        <div style={{ display: "flex", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 44, color: C.signal, marginTop: 18 }}>
          {`${servicesIntro.title} ${servicesIntro.accent}`}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 26 }}>
          {offerings.map((o) => (
            <div
              key={o.title}
              style={{ display: "flex", fontSize: 18, letterSpacing: 1, color: C.bone, border: "1.5px solid #3a3935", borderRadius: 40, padding: "8px 16px", marginRight: 10, marginBottom: 10 }}
            >
              {o.title.toUpperCase()}
            </div>
          ))}
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
