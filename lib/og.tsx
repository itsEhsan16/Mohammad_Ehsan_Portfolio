import { readFile } from "node:fs/promises";
import path from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

export async function ogFonts() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  const [archivo, serif] = await Promise.all([
    readFile(path.join(dir, "og-archivo-900.woff")),
    readFile(path.join(dir, "og-instrument-serif-italic.woff")),
  ]);
  return [
    { name: "Archivo", data: archivo, weight: 900 as const, style: "normal" as const },
    { name: "Instrument Serif", data: serif, weight: 400 as const, style: "italic" as const },
  ];
}

const C = { ink: "#0B0B0A", bone: "#EDEAE4", mute: "#8C8A85", signal: "#FF4D00" };

/** Shared OG frame: ink paper, halftone field, HUD row, and a footer. */
export function OgFrame({ eyebrow, children, footer }: { eyebrow: string; children: React.ReactNode; footer: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: C.ink,
        backgroundImage: `radial-gradient(circle, #24231f 1.4px, transparent 1.6px)`,
        backgroundSize: "14px 14px",
        padding: "48px 56px",
        color: C.bone,
        fontFamily: "Archivo",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, letterSpacing: 2, color: C.mute }}>
        <span style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: 12, height: 12, borderRadius: 12, background: C.signal, marginRight: 14 }} />
          {eyebrow}
        </span>
        <span>MOHAMMAD_EHSAN._</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, letterSpacing: 2, color: C.mute }}>
        <span>{footer}</span>
        <span style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: 14, height: 14, borderRadius: 14, background: "#3DDC84", marginRight: 10 }} />
          OPEN TO WORK · INDIA · IST
        </span>
      </div>
    </div>
  );
}

export const OG_COLORS = C;
