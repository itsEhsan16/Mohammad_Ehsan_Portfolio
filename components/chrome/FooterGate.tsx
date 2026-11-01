"use client";

import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";

/** Case studies render the footer themselves (above the scroll-to-advance zone); the /work field has none. */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const field = useApp((s) => s.field);
  if (field || /^\/work\/[^/]+\/?$/.test(pathname)) return null;
  return <>{children}</>;
}
