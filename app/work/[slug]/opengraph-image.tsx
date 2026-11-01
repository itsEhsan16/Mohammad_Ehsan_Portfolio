import { ImageResponse } from "next/og";
import { projects, statusLabel } from "@/content/projects";
import { site } from "@/content/site";
import { OG_COLORS as C, OG_SIZE, OgFrame, ogFonts } from "@/lib/og";

export const alt = "Case study";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug) ?? projects[0];
  const n = String(p.index).padStart(2, "0");
  return new ImageResponse(
    (
      <OgFrame eyebrow={`CASE STUDY · N°${n} — ${p.kind.toUpperCase()}`} footer={`${site.name.toUpperCase()} · ${statusLabel[p.status].toUpperCase()}`}>
        <div style={{ display: "flex", fontSize: p.title.length > 12 ? 128 : 168, lineHeight: 0.86, letterSpacing: -5, textTransform: "uppercase" }}>
          {p.title}
        </div>
        <div style={{ display: "flex", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 44, color: C.signal, marginTop: 18 }}>
          {p.tagline}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 26 }}>
          {p.stack.slice(0, 5).map((s) => (
            <div
              key={s}
              style={{ display: "flex", fontSize: 18, letterSpacing: 1, color: C.bone, border: `1.5px solid #3a3935`, borderRadius: 40, padding: "8px 16px", marginRight: 10 }}
            >
              {s.toUpperCase()}
            </div>
          ))}
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
