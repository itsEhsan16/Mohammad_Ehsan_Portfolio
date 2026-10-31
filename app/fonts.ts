import localFont from "next/font/local";

/** Display — Archivo variable with both weight and width axes (giant type, letter stretch). */
export const archivo = localFont({
  src: [{ path: "../assets/fonts/archivo-var.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  fallback: ["Arial Narrow", "Arial", "sans-serif"],
});

/** UI / body. */
export const geist = localFont({
  src: [{ path: "../assets/fonts/geist-var.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-geist",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/** HUD / meta — keeps the original `01 //` mono identity. */
export const geistMono = localFont({
  src: [{ path: "../assets/fonts/geist-mono-var.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

/** Editorial accent words. */
export const instrument = localFont({
  src: [
    { path: "../assets/fonts/instrument-serif.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const fontVariables = [archivo.variable, geist.variable, geistMono.variable, instrument.variable].join(" ");
