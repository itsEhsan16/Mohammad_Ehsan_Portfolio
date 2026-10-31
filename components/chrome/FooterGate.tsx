"use client";

import { usePathname } from "next/navigation";

/** Case studies render the footer themselves (above the scroll-to-advance zone). */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (/^\/work\/[^/]+\/?$/.test(pathname)) return null;
  return <>{children}</>;
}
