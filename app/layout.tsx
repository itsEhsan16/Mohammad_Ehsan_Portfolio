import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { site } from "@/content/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.role}`, template: `%s — ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#0b0b0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="ink" className={fontVariables} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
