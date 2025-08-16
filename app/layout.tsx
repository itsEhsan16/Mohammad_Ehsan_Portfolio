import type React from "react";
import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThreeProvider } from "@/contexts/three-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { trackPageView } from "@/lib/analytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Mohammad Ehsan | Portfolio",
  description: "Software Engineer, Front End & App Developer",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Track page views in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    trackPageView(window.location.pathname);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceMono.variable} font-sans bg-background`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ThreeProvider>{children}</ThreeProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
