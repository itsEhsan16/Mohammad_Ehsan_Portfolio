import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { site } from "@/content/site";
import { AppProviders } from "@/components/providers/AppProviders";
import { RouteWatcher } from "@/components/transition/RouteWatcher";
import { Hud } from "@/components/chrome/Hud";
import { Header } from "@/components/chrome/Header";
import { MobileMenu } from "@/components/chrome/MobileMenu";
import { Cursor } from "@/components/chrome/Cursor";
import { Toaster } from "@/components/chrome/Toaster";
import { Preloader } from "@/components/chrome/Preloader";
import { Footer } from "@/components/chrome/Footer";
import { GLCanvas } from "@/components/gl/GLCanvas";
import { TransitionLayer } from "@/components/transition/TransitionLayer";
import { CommandMenuLoader } from "@/components/chrome/CommandMenuLoader";
import { FooterGate } from "@/components/chrome/FooterGate";
import { jsonLd, personJsonLd } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.role}`, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  keywords: ["Mohammad Ehsan", "software engineer", "front-end developer", "React", "Next.js", "TypeScript", "portfolio", "India"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: `${site.name} — Portfolio`,
    title: `${site.name} — ${site.role}`,
    description: site.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    creator: site.twitterHandle,
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0a",
  colorScheme: "dark light",
};

/**
 * Runs before first paint (from the server layout): theme, motion preference,
 * WebGL policy, preloader gating, the /work view and scroll restoration. Test
 * flags: ?gl=force|0, ?boot=1|0, ?view=field|index.
 */
const BOOT = `(function(){var d=document.documentElement,q=new URLSearchParams(location.search);d.classList.add('js');try{var t=localStorage.getItem('me:theme');d.dataset.theme=t==='paper'?'paper':'ink';var m=localStorage.getItem('me:motion');var rm=m==='reduce'||(m!=='full'&&matchMedia('(prefers-reduced-motion: reduce)').matches);if(rm)d.classList.add('reduce');var fine=matchMedia('(pointer: fine) and (hover: hover)').matches,fc=matchMedia('(forced-colors: active)').matches,g=q.get('gl'),sd=navigator.connection&&navigator.connection.saveData;if(g!=='force'&&(g==='0'||rm||fc||!fine||sd))d.classList.add('no-gl');var bot=navigator.webdriver||/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent);var b=q.get('boot');d.dataset.boot=b==='1'?'run':(b==='0'||bot||sessionStorage.getItem('me:booted'))?'skip':rm?'fade':'run';var wv=q.get('view')||localStorage.getItem('me:workview');d.dataset.workview=wv==='field'?'field':(wv==='index'||rm||bot)?'index':'field';history.scrollRestoration='manual';}catch(e){d.dataset.boot='skip';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd()) }} />
      </head>
      <body>
        <a
          href="#main"
          className="t-label fixed left-3 top-3 z-[200] -translate-y-20 rounded-full bg-signal px-4 py-2 text-ink focus:translate-y-0"
        >
          Skip to content
        </a>
        <span id="top" aria-hidden="true" />
        <AppProviders>
          <RouteWatcher />
          <GLCanvas />
          <Hud />
          <Header />
          <MobileMenu />
          {children}
          <FooterGate>
            <Footer />
          </FooterGate>
          <TransitionLayer />
          <CommandMenuLoader />
          <Cursor />
          <Toaster />
          <Preloader />
        </AppProviders>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
