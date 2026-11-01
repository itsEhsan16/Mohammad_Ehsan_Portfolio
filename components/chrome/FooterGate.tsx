"use client";

import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";

/**
 * Case studies render the footer themselves (above the scroll-to-advance zone);
 * the /work views fill the screen and have none. On /contact the footer drops
 * its "Start a project" block, which repeats the page.
 */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const field = useApp((s) => s.field);
  if (field || /^\/work\/[^/]+\/?$/.test(pathname)) return null;
  if (/^\/contact\/?$/.test(pathname)) {
    return (
      <div className="contents" data-footer-route="contact">
        {children}
      </div>
    );
  }
  return <>{children}</>;
}
