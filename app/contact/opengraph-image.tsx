import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { OG_COLORS as C, OG_SIZE, OgFrame, ogFonts } from "@/lib/og";

export const alt = `Contact ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgFrame eyebrow="CONTACT — SAY HELLO" footer={`${site.url.replace(/^https?:\/\//, "").toUpperCase()}/CONTACT`}>
        <div style={{ display: "flex", fontSize: 168, lineHeight: 0.84, letterSpacing: -6, textTransform: "uppercase" }}>Contact</div>
        <div style={{ display: "flex", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 44, color: C.signal, marginTop: 18 }}>
          {"Let's build something worth shipping."}
        </div>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 1, color: C.bone, marginTop: 22 }}>{site.email}</div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
